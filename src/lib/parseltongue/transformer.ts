/**
 * Parseltongue → Viz-Wizard Data Transformer
 *
 * Converts Parseltongue's code analysis output into Viz-Wizard's
 * visualization format (FileNodes, Connections, etc.)
 */

import type {
  FileNode,
  FileCategory,
  Connection,
  ConnectionType,
  RepositoryData,
  RepositoryStats,
} from '@/types/repository';

import type {
  CodeEntity,
  Dependency,
  DependencyKind,
  HotspotInfo,
  CodebaseStats,
  CircularDependency,
} from './client';

// ===== ID Generation =====

/**
 * Generate a stable file ID from path
 */
export function generateFileId(path: string): string {
  return `file-${path.replace(/[^a-zA-Z0-9]/g, '-')}`;
}

/**
 * Generate a stable connection ID
 */
export function generateConnectionId(sourceId: string, targetId: string, type: ConnectionType): string {
  return `conn-${sourceId}-${targetId}-${type}`;
}

// ===== File Category Classification =====

const TEST_PATTERNS = [
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /\/__tests__\//,
  /\/test\//,
  /_test\.[^.]+$/,
  /tests?\//i,
];

const STYLE_PATTERNS = [
  /\.css$/,
  /\.scss$/,
  /\.sass$/,
  /\.less$/,
  /\.styl$/,
  /\.styled\.[jt]sx?$/,
];

const CONFIG_PATTERNS = [
  /\.config\.[jt]s$/,
  /\.json$/,
  /\.ya?ml$/,
  /\.toml$/,
  /\.env/,
  /rc\.[jt]s$/,
  /rc\.json$/,
  /vite\.config/,
  /next\.config/,
  /webpack\.config/,
  /tsconfig/,
  /eslint/,
  /prettier/,
  /package\.json$/,
  /Cargo\.toml$/,
  /go\.mod$/,
  /requirements\.txt$/,
];

const DOCS_PATTERNS = [
  /\.md$/,
  /\.mdx$/,
  /\.rst$/,
  /\.txt$/,
  /readme/i,
  /changelog/i,
  /license/i,
  /contributing/i,
];

const LEGACY_PATTERNS = [
  /\.js$/,      // Plain JS (not JSX) often legacy
  /legacy\//i,
  /deprecated\//i,
  /old\//i,
];

/**
 * Classify a file into a category based on its path
 */
export function classifyFile(path: string, entities?: CodeEntity[]): FileCategory {
  const lowerPath = path.toLowerCase();

  // Test files
  if (TEST_PATTERNS.some(p => p.test(path))) {
    return 'test';
  }

  // Style files
  if (STYLE_PATTERNS.some(p => p.test(path))) {
    return 'style';
  }

  // Config files
  if (CONFIG_PATTERNS.some(p => p.test(path))) {
    return 'config';
  }

  // Documentation
  if (DOCS_PATTERNS.some(p => p.test(path))) {
    return 'docs';
  }

  // Legacy (plain .js files, but not .jsx/.mjs)
  if (lowerPath.endsWith('.js') && !lowerPath.endsWith('.mjs')) {
    // Check if it's actually modern JS with exports/imports
    if (entities && entities.length > 0) {
      // Has code entities - likely modern, treat as core
      return 'core';
    }
    // Could be legacy or modern - default to core
    return 'core';
  }

  // Legacy directories
  if (LEGACY_PATTERNS.some(p => p.test(lowerPath))) {
    return 'legacy';
  }

  // Default to core
  return 'core';
}

// ===== Dependency Type Mapping =====

/**
 * Map Parseltongue dependency kinds to Viz-Wizard connection types
 */
export function mapDependencyType(kind: DependencyKind): ConnectionType {
  const mapping: Record<DependencyKind, ConnectionType> = {
    calls: 'call',
    imports: 'import',
    extends: 'extends',
    implements: 'implements',
    uses: 'dataflow',
    defines: 'import', // Treat defines as import-like relationship
  };
  return mapping[kind] || 'import';
}

// ===== Language Detection =====

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  py: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cxx: 'cpp',
  cc: 'cpp',
  hpp: 'cpp',
  rb: 'ruby',
  php: 'php',
  cs: 'csharp',
  swift: 'swift',
  kt: 'kotlin',
  scala: 'scala',
  css: 'css',
  scss: 'scss',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  html: 'html',
  xml: 'xml',
  sql: 'sql',
  sh: 'shell',
  bash: 'shell',
};

/**
 * Get language for syntax highlighting from file extension
 */
export function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  return EXTENSION_TO_LANGUAGE[ext] || 'plaintext';
}

// ===== Core Transformers =====

/**
 * Calculate line count from entities (approximate)
 */
function calculateLineCount(entities: CodeEntity[]): number {
  if (entities.length === 0) return 0;

  let maxLine = 0;
  for (const entity of entities) {
    if (entity.line_end > maxLine) {
      maxLine = entity.line_end;
    }
  }
  return maxLine;
}

/**
 * Estimate complexity from entities
 * Factors: number of entities, nesting, function size
 */
function estimateComplexity(entities: CodeEntity[], hotspot?: HotspotInfo): number {
  // If we have a hotspot score, use it directly
  if (hotspot?.complexity_score !== undefined) {
    return Math.min(100, Math.max(0, hotspot.complexity_score));
  }

  // Otherwise estimate from entities
  if (entities.length === 0) return 10;

  // Base complexity from entity count
  let complexity = Math.min(30, entities.length * 3);

  // Add complexity for nested entities
  const nestedCount = entities.filter(e => e.parent_id).length;
  complexity += Math.min(20, nestedCount * 2);

  // Add complexity for large functions
  for (const entity of entities) {
    if (entity.kind === 'function' || entity.kind === 'method') {
      const lines = entity.line_end - entity.line_start;
      if (lines > 50) complexity += 10;
      else if (lines > 30) complexity += 5;
      else if (lines > 20) complexity += 2;
    }
  }

  // Add complexity for classes with many methods
  const classes = entities.filter(e => e.kind === 'class');
  for (const cls of classes) {
    const methods = entities.filter(e => e.parent_id === cls.id && e.kind === 'method');
    if (methods.length > 10) complexity += 15;
    else if (methods.length > 5) complexity += 8;
  }

  return Math.min(100, Math.max(0, complexity));
}

/**
 * Transform Parseltongue entities into Viz-Wizard FileNodes
 */
export function entitiesToFileNodes(
  entities: CodeEntity[],
  hotspots: HotspotInfo[]
): FileNode[] {
  // Group entities by file
  const fileMap = new Map<string, CodeEntity[]>();
  for (const entity of entities) {
    const existing = fileMap.get(entity.file_path) || [];
    existing.push(entity);
    fileMap.set(entity.file_path, existing);
  }

  // Create hotspot lookup
  const hotspotMap = new Map<string, HotspotInfo>();
  for (const hotspot of hotspots) {
    hotspotMap.set(hotspot.file_path, hotspot);
  }

  // Create FileNodes
  const fileNodes: FileNode[] = [];
  for (const [path, fileEntities] of fileMap.entries()) {
    const hotspot = hotspotMap.get(path);
    const name = path.split('/').pop() || path;
    const ext = name.split('.').pop() || '';

    fileNodes.push({
      id: generateFileId(path),
      name,
      path,
      extension: ext,
      category: classifyFile(path, fileEntities),
      lineCount: calculateLineCount(fileEntities),
      complexity: estimateComplexity(fileEntities, hotspot),
      language: getLanguageFromPath(path),
      // imports and importedBy will be filled in later by buildConnections
    });
  }

  return fileNodes;
}

/**
 * Transform Parseltongue dependencies into Viz-Wizard Connections
 */
export function dependenciesToConnections(
  dependencies: Dependency[],
  entityMap: Map<string, CodeEntity>
): Connection[] {
  // Group dependencies by file pair to avoid duplicate connections
  const connectionMap = new Map<string, Connection>();

  for (const dep of dependencies) {
    const sourceEntity = entityMap.get(dep.source_id);
    const targetEntity = entityMap.get(dep.target_id);

    if (!sourceEntity || !targetEntity) continue;

    // Skip self-references within same file
    if (sourceEntity.file_path === targetEntity.file_path) continue;

    const sourceFileId = generateFileId(sourceEntity.file_path);
    const targetFileId = generateFileId(targetEntity.file_path);
    const connectionType = mapDependencyType(dep.kind);

    const key = `${sourceFileId}-${targetFileId}-${connectionType}`;

    if (connectionMap.has(key)) {
      // Increment weight for existing connection
      const existing = connectionMap.get(key)!;
      existing.weight += 1;
    } else {
      // Create new connection
      connectionMap.set(key, {
        id: generateConnectionId(sourceFileId, targetFileId, connectionType),
        sourceId: sourceFileId,
        targetId: targetFileId,
        type: connectionType,
        weight: 1,
        metadata: {
          functionName: dep.kind === 'calls' ? targetEntity.name : undefined,
          lineNumber: dep.line_number,
        },
      });
    }
  }

  return Array.from(connectionMap.values());
}

/**
 * Build import/importedBy relationships on FileNodes
 */
export function populateFileRelationships(
  files: FileNode[],
  connections: Connection[]
): void {
  // Create file lookup
  const fileMap = new Map<string, FileNode>();
  for (const file of files) {
    fileMap.set(file.id, file);
    file.imports = [];
    file.importedBy = [];
  }

  // Populate relationships from connections
  for (const conn of connections) {
    if (conn.type === 'import') {
      const sourceFile = fileMap.get(conn.sourceId);
      const targetFile = fileMap.get(conn.targetId);

      if (sourceFile && targetFile) {
        sourceFile.imports = sourceFile.imports || [];
        targetFile.importedBy = targetFile.importedBy || [];

        if (!sourceFile.imports.includes(conn.targetId)) {
          sourceFile.imports.push(conn.targetId);
        }
        if (!targetFile.importedBy.includes(conn.sourceId)) {
          targetFile.importedBy.push(conn.sourceId);
        }
      }
    }
  }
}

/**
 * Count unique directories from file paths
 */
function countDirectories(files: FileNode[]): number {
  const dirs = new Set<string>();
  for (const file of files) {
    const parts = file.path.split('/');
    // Add all parent directories
    for (let i = 1; i < parts.length; i++) {
      dirs.add(parts.slice(0, i).join('/'));
    }
  }
  return dirs.size;
}

/**
 * Build complete RepositoryData from Parseltongue data
 */
export function buildRepositoryData(
  repoInfo: { owner: string; name: string; description?: string },
  entities: CodeEntity[],
  dependencies: Dependency[],
  hotspots: HotspotInfo[],
  stats: CodebaseStats,
  circularDeps?: CircularDependency[]
): RepositoryData {
  // Build entity map for dependency resolution
  const entityMap = new Map<string, CodeEntity>();
  for (const entity of entities) {
    entityMap.set(entity.id, entity);
  }

  // Transform entities to file nodes
  const files = entitiesToFileNodes(entities, hotspots);

  // Transform dependencies to connections
  const connections = dependenciesToConnections(dependencies, entityMap);

  // Populate import relationships on files
  populateFileRelationships(files, connections);

  // Calculate stats
  const repoStats: RepositoryStats = {
    totalFiles: files.length,
    totalLines: files.reduce((sum, f) => sum + f.lineCount, 0),
    totalDirectories: countDirectories(files),
    languages: stats.languages,
    avgComplexity: files.length > 0
      ? files.reduce((sum, f) => sum + f.complexity, 0) / files.length
      : 0,
  };

  return {
    owner: repoInfo.owner,
    name: repoInfo.name,
    description: repoInfo.description,
    allFiles: files,
    connections,
    stats: repoStats,
    // Could add circularDependencies to the type if needed
  };
}

/**
 * Merge GitHub file data with Parseltongue analysis
 *
 * When we have GitHub files but also Parseltongue analysis,
 * we want to keep files from GitHub (for proper paths/names)
 * but enhance them with Parseltongue complexity/connections.
 */
export function mergeGitHubWithParseltongue(
  githubFiles: FileNode[],
  entities: CodeEntity[],
  dependencies: Dependency[],
  hotspots: HotspotInfo[]
): {
  files: FileNode[];
  connections: Connection[];
} {
  // Build entity map
  const entityMap = new Map<string, CodeEntity>();
  for (const entity of entities) {
    entityMap.set(entity.id, entity);
  }

  // Build hotspot map by file path
  const hotspotMap = new Map<string, HotspotInfo>();
  for (const hotspot of hotspots) {
    hotspotMap.set(hotspot.file_path, hotspot);
  }

  // Group entities by file path
  const entitiesByFile = new Map<string, CodeEntity[]>();
  for (const entity of entities) {
    const existing = entitiesByFile.get(entity.file_path) || [];
    existing.push(entity);
    entitiesByFile.set(entity.file_path, existing);
  }

  // Enhance GitHub files with Parseltongue data
  const enhancedFiles = githubFiles.map(file => {
    const fileEntities = entitiesByFile.get(file.path) || [];
    const hotspot = hotspotMap.get(file.path);

    // Update complexity if we have analysis
    const complexity = fileEntities.length > 0 || hotspot
      ? estimateComplexity(fileEntities, hotspot)
      : file.complexity;

    // Update line count if we have better data
    const lineCount = fileEntities.length > 0
      ? Math.max(file.lineCount, calculateLineCount(fileEntities))
      : file.lineCount;

    return {
      ...file,
      complexity,
      lineCount,
    };
  });

  // Build connections from Parseltongue
  const connections = dependenciesToConnections(dependencies, entityMap);

  // Populate import relationships
  populateFileRelationships(enhancedFiles, connections);

  return {
    files: enhancedFiles,
    connections,
  };
}

export default {
  generateFileId,
  generateConnectionId,
  classifyFile,
  mapDependencyType,
  getLanguageFromPath,
  entitiesToFileNodes,
  dependenciesToConnections,
  populateFileRelationships,
  buildRepositoryData,
  mergeGitHubWithParseltongue,
};
