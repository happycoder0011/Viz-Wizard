/**
 * Parseltongue Real-time Query Functions
 *
 * Higher-level query functions that power Viz-Wizard features
 * using the Parseltongue client.
 */

import type { ParseltongueClient, CodeEntity, HotspotInfo } from './client';
import { generateFileId } from './transformer';

// ===== Critical Path Radar =====

export interface CriticalPathScore {
  fileId: string;
  filePath: string;
  fileName: string;
  couplingScore: number;      // 0-100, how connected is this file
  complexityScore: number;    // 0-100, from Parseltongue
  velocityScore: number;      // 0-100, how often it changes (needs git data)
  coverageScore: number;      // 0-100, test coverage (placeholder)
  overallRisk: number;        // Weighted combination
  factors: string[];          // Human-readable risk factors
}

/**
 * Get critical path files using Parseltongue hotspots
 *
 * This is the main function for the Critical Path Radar feature.
 */
export async function getCriticalPathFiles(
  client: ParseltongueClient,
  topN: number = 10,
  velocityData?: Map<string, number>  // Optional git velocity data
): Promise<CriticalPathScore[]> {
  const hotspots = await client.getHotspots(topN * 2); // Get more to filter

  const scores: CriticalPathScore[] = [];

  for (const hotspot of hotspots) {
    const fileName = hotspot.file_path.split('/').pop() || hotspot.file_path;

    // Coupling score from connection count (normalized to 0-100)
    const couplingScore = Math.min(100, hotspot.connection_count * 5);

    // Complexity score directly from Parseltongue
    const complexityScore = Math.min(100, hotspot.complexity_score);

    // Velocity score from git data if available, otherwise placeholder
    const velocityScore = velocityData?.get(hotspot.file_path) ?? 50;

    // Coverage score placeholder (would need test framework integration)
    const coverageScore = 50;

    // Weighted overall risk
    // Weights: coupling 35%, complexity 30%, velocity 20%, coverage 15%
    const overallRisk =
      couplingScore * 0.35 +
      complexityScore * 0.30 +
      velocityScore * 0.20 +
      (100 - coverageScore) * 0.15; // Low coverage = high risk

    scores.push({
      fileId: generateFileId(hotspot.file_path),
      filePath: hotspot.file_path,
      fileName,
      couplingScore,
      complexityScore,
      velocityScore,
      coverageScore,
      overallRisk,
      factors: hotspot.risk_factors,
    });
  }

  // Sort by overall risk and take top N
  return scores
    .sort((a, b) => b.overallRisk - a.overallRisk)
    .slice(0, topN);
}

// ===== Blast Radius / Impact Analysis =====

export interface BlastRadiusResult {
  originFile: string;
  originFileId: string;
  affectedFiles: Array<{
    fileId: string;
    filePath: string;
    fileName: string;
    hopDistance: number;
    impactType: 'direct' | 'indirect';
  }>;
  totalAffected: number;
  riskScore: number;  // 0-100 based on how many files affected
}

/**
 * Get blast radius for a file
 *
 * Shows all files that would be affected if this file changes.
 * Powers the Impact Analysis feature.
 */
export async function getBlastRadiusForFile(
  client: ParseltongueClient,
  filePath: string,
  maxHops: number = 3
): Promise<BlastRadiusResult> {
  // Get all entities in the file
  const entities = await client.getEntitiesInFile(filePath);

  // Collect all affected entities across all hops
  const affectedMap = new Map<string, { entity: CodeEntity; hopDistance: number }>();

  for (const entity of entities) {
    try {
      const blastResult = await client.getBlastRadius(entity.id, maxHops);

      for (const affected of blastResult.affected_entities) {
        // Skip entities in the same file
        if (affected.file_path === filePath) continue;

        const existing = affectedMap.get(affected.file_path);
        if (!existing || existing.hopDistance > blastResult.hop_count) {
          affectedMap.set(affected.file_path, {
            entity: affected,
            hopDistance: blastResult.hop_count,
          });
        }
      }
    } catch {
      // Skip if entity doesn't exist or other error
      continue;
    }
  }

  // Transform to result format
  const affectedFiles = Array.from(affectedMap.entries()).map(([path, { entity, hopDistance }]) => ({
    fileId: generateFileId(path),
    filePath: path,
    fileName: path.split('/').pop() || path,
    hopDistance,
    impactType: (hopDistance === 1 ? 'direct' : 'indirect') as 'direct' | 'indirect',
  }));

  // Sort by hop distance (closest first)
  affectedFiles.sort((a, b) => a.hopDistance - b.hopDistance);

  // Calculate risk score based on affected count
  const riskScore = Math.min(100, affectedFiles.length * 10);

  return {
    originFile: filePath,
    originFileId: generateFileId(filePath),
    affectedFiles,
    totalAffected: affectedFiles.length,
    riskScore,
  };
}

// ===== Find Usages =====

export interface FileUsages {
  fileId: string;
  filePath: string;
  usedBy: Array<{
    fileId: string;
    filePath: string;
    fileName: string;
    entityName: string;
    lineNumber?: number;
  }>;
  uses: Array<{
    fileId: string;
    filePath: string;
    fileName: string;
    entityName: string;
    lineNumber?: number;
  }>;
}

/**
 * Get file usages
 *
 * Shows which files use this file and which files this file uses.
 * Powers the Find Usages feature.
 */
export async function getFileUsages(
  client: ParseltongueClient,
  filePath: string
): Promise<FileUsages> {
  const entities = await client.getEntitiesInFile(filePath);

  const usedBySet = new Map<string, { entity: CodeEntity; callerEntity: CodeEntity }>();
  const usesSet = new Map<string, { entity: CodeEntity; calleeEntity: CodeEntity }>();

  for (const entity of entities) {
    try {
      // Get who calls/uses this entity
      const callers = await client.getCallers(entity.id);
      for (const caller of callers) {
        if (caller.file_path !== filePath) {
          const key = `${caller.file_path}:${caller.name}`;
          if (!usedBySet.has(key)) {
            usedBySet.set(key, { entity: caller, callerEntity: entity });
          }
        }
      }

      // Get what this entity calls/uses
      const callees = await client.getCallees(entity.id);
      for (const callee of callees) {
        if (callee.file_path !== filePath) {
          const key = `${callee.file_path}:${callee.name}`;
          if (!usesSet.has(key)) {
            usesSet.set(key, { entity: callee, calleeEntity: entity });
          }
        }
      }
    } catch {
      continue;
    }
  }

  return {
    fileId: generateFileId(filePath),
    filePath,
    usedBy: Array.from(usedBySet.values()).map(({ entity, callerEntity }) => ({
      fileId: generateFileId(entity.file_path),
      filePath: entity.file_path,
      fileName: entity.file_path.split('/').pop() || entity.file_path,
      entityName: entity.name,
      lineNumber: entity.line_start,
    })),
    uses: Array.from(usesSet.values()).map(({ entity }) => ({
      fileId: generateFileId(entity.file_path),
      filePath: entity.file_path,
      fileName: entity.file_path.split('/').pop() || entity.file_path,
      entityName: entity.name,
      lineNumber: entity.line_start,
    })),
  };
}

// ===== Circular Dependencies =====

export interface CircularDependencyInfo {
  id: string;
  files: Array<{
    fileId: string;
    filePath: string;
    fileName: string;
  }>;
  cycleLength: number;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Get circular dependencies in the codebase
 *
 * Identifies cycles in the dependency graph that could cause issues.
 */
export async function getCircularDependencies(
  client: ParseltongueClient
): Promise<CircularDependencyInfo[]> {
  const cycles = await client.getCircularDependencies();

  return cycles.map((cycle, index) => {
    const files = cycle.files.map(path => ({
      fileId: generateFileId(path),
      filePath: path,
      fileName: path.split('/').pop() || path,
    }));

    // Determine severity based on cycle length
    let severity: 'low' | 'medium' | 'high';
    if (cycle.cycle.length <= 2) {
      severity = 'low';
    } else if (cycle.cycle.length <= 4) {
      severity = 'medium';
    } else {
      severity = 'high';
    }

    return {
      id: `cycle-${index}`,
      files,
      cycleLength: cycle.cycle.length,
      severity,
    };
  });
}

// ===== Entity Search =====

export interface SearchResult {
  entityId: string;
  entityName: string;
  entityKind: string;
  fileId: string;
  filePath: string;
  fileName: string;
  lineStart: number;
  lineEnd: number;
  signature?: string;
}

/**
 * Search for code entities
 *
 * Fuzzy search by name across all entities.
 */
export async function searchEntities(
  client: ParseltongueClient,
  query: string,
  limit: number = 20
): Promise<SearchResult[]> {
  const entities = await client.searchEntities(query);

  return entities.slice(0, limit).map(entity => ({
    entityId: entity.id,
    entityName: entity.name,
    entityKind: entity.kind,
    fileId: generateFileId(entity.file_path),
    filePath: entity.file_path,
    fileName: entity.file_path.split('/').pop() || entity.file_path,
    lineStart: entity.line_start,
    lineEnd: entity.line_end,
    signature: entity.signature,
  }));
}

// ===== Module Overview =====

export interface ModuleOverview {
  modulePath: string;
  moduleId: string;
  fileCount: number;
  entityCount: number;
  entryPoints: string[];
  internalCohesion: number;  // 0-100, how connected within module
  externalCoupling: number;  // 0-100, how connected to other modules
}

/**
 * Get module-level overview
 *
 * Provides high-level view of code organization by module/directory.
 */
export async function getModuleOverview(
  client: ParseltongueClient
): Promise<ModuleOverview[]> {
  const groups = await client.getModuleGroups();

  return groups.map(group => {
    const totalEdges = group.internal_edges + group.external_edges;
    const internalCohesion = totalEdges > 0
      ? Math.round((group.internal_edges / totalEdges) * 100)
      : 50;
    const externalCoupling = totalEdges > 0
      ? Math.round((group.external_edges / totalEdges) * 100)
      : 50;

    return {
      modulePath: group.module_path,
      moduleId: generateFileId(group.module_path),
      fileCount: new Set(group.entities.map(e => e.file_path)).size,
      entityCount: group.entities.length,
      entryPoints: group.entry_points,
      internalCohesion,
      externalCoupling,
    };
  });
}

// ===== Complexity Metrics =====

export interface FileComplexityMetrics {
  fileId: string;
  filePath: string;
  totalComplexity: number;
  entityCount: number;
  avgComplexityPerEntity: number;
  hotspotEntity?: {
    name: string;
    complexity: number;
  };
}

/**
 * Get detailed complexity metrics for a file
 */
export async function getFileComplexityMetrics(
  client: ParseltongueClient,
  filePath: string
): Promise<FileComplexityMetrics> {
  const metrics = await client.getFileComplexity(filePath);

  return {
    fileId: generateFileId(filePath),
    filePath: metrics.file_path,
    totalComplexity: metrics.total_complexity,
    entityCount: metrics.entity_count,
    avgComplexityPerEntity: metrics.avg_complexity_per_entity,
    hotspotEntity: metrics.max_complexity_entity
      ? { name: metrics.max_complexity_entity, complexity: metrics.total_complexity }
      : undefined,
  };
}

export default {
  getCriticalPathFiles,
  getBlastRadiusForFile,
  getFileUsages,
  getCircularDependencies,
  searchEntities,
  getModuleOverview,
  getFileComplexityMetrics,
};
