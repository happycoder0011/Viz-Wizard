/**
 * Hotspot Detection
 *
 * Identifies high-risk files by combining:
 * - Complexity (from Parseltongue or estimation)
 * - Velocity (change frequency)
 * - Ownership (bus factor risk)
 *
 * Files that are complex, change often, and have concentrated
 * ownership are the highest risk hotspots.
 */

import type { FileNode } from '@/types/repository';
import type { FileVelocity } from './velocity';
import type { FileOwnership } from './ownership';

export interface HotspotFactors {
  complexity: number;          // 0-100
  velocity: number;            // 0-100
  ownership: number;           // 0-100 (inverted: high = risky = low bus factor)
  coverage: number;            // 0-100 (placeholder for test coverage)
}

export interface Hotspot {
  path: string;
  fileId: string;
  fileName: string;
  score: number;               // Composite risk score 0-100
  factors: HotspotFactors;
  recommendation: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  contributors: string[];
  lastModified?: Date;
}

export interface HotspotWeights {
  complexity: number;
  velocity: number;
  ownership: number;
  coverage: number;
}

const DEFAULT_WEIGHTS: HotspotWeights = {
  complexity: 0.35,
  velocity: 0.30,
  ownership: 0.20,
  coverage: 0.15,
};

/**
 * Detect hotspots by combining multiple risk factors
 */
export function detectHotspots(
  files: FileNode[],
  velocityMap: Map<string, FileVelocity>,
  ownershipMap: Map<string, FileOwnership>,
  options: {
    weights?: Partial<HotspotWeights>;
    topN?: number;
    includeAll?: boolean;
  } = {}
): Hotspot[] {
  const weights = { ...DEFAULT_WEIGHTS, ...options.weights };
  const { topN = 20, includeAll = false } = options;

  const hotspots: Hotspot[] = [];

  for (const file of files) {
    // Get velocity data
    const velocity = velocityMap.get(file.path);
    const velocityScore = velocity?.velocityScore ?? 30; // Default moderate

    // Get ownership data
    const ownership = ownershipMap.get(file.path);
    // Invert ownership: high concentration (1 owner) = high risk
    // busFactor 1 = 100 risk, busFactor 3+ = 0 risk
    const ownershipRisk = ownership
      ? Math.max(0, 100 - (ownership.busFactor - 1) * 50)
      : 50; // Default moderate risk

    // Complexity from file
    const complexityScore = file.complexity ?? 50;

    // Coverage placeholder (would need integration with test frameworks)
    // For now, estimate based on whether file is in test directory or has tests
    const coverageScore = estimateCoverage(file);
    const coverageRisk = 100 - coverageScore; // Low coverage = high risk

    // Calculate composite score
    const factors: HotspotFactors = {
      complexity: complexityScore,
      velocity: velocityScore,
      ownership: ownershipRisk,
      coverage: coverageRisk,
    };

    const score = Math.round(
      factors.complexity * weights.complexity +
      factors.velocity * weights.velocity +
      factors.ownership * weights.ownership +
      factors.coverage * weights.coverage
    );

    // Generate recommendation
    const recommendation = generateRecommendation(factors, file);

    // Determine risk level
    const riskLevel = getRiskLevel(score);

    hotspots.push({
      path: file.path,
      fileId: file.id,
      fileName: file.name,
      score,
      factors,
      recommendation,
      riskLevel,
      contributors: ownership?.contributors.map(c => c.name) ?? [],
      lastModified: velocity?.lastChanged,
    });
  }

  // Sort by score descending
  hotspots.sort((a, b) => b.score - a.score);

  // Return all or top N
  return includeAll ? hotspots : hotspots.slice(0, topN);
}

/**
 * Estimate test coverage based on file characteristics
 */
function estimateCoverage(file: FileNode): number {
  // Test files themselves have 100% "coverage"
  if (file.category === 'test') {
    return 100;
  }

  // Config, docs, styles typically don't need test coverage
  if (['config', 'docs', 'style'].includes(file.category)) {
    return 80;
  }

  // Check if there's a corresponding test file (heuristic)
  // This would be better with actual test framework integration
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const hasTestPattern = file.path.includes('__tests__') ||
    file.path.includes('/test/') ||
    file.path.includes('.test.') ||
    file.path.includes('.spec.');

  if (hasTestPattern) {
    return 100;
  }

  // Default: assume moderate coverage for core files
  if (file.category === 'core') {
    return 50;
  }

  return 60;
}

/**
 * Generate actionable recommendation based on factors
 */
function generateRecommendation(factors: HotspotFactors, file: FileNode): string {
  const issues: string[] = [];

  if (factors.complexity >= 70) {
    issues.push('high complexity');
  }
  if (factors.velocity >= 70) {
    issues.push('frequent changes');
  }
  if (factors.ownership >= 70) {
    issues.push('concentrated ownership');
  }
  if (factors.coverage >= 70) {
    issues.push('low test coverage');
  }

  if (issues.length === 0) {
    return 'File is in good health.';
  }

  if (issues.length === 1) {
    return `Consider addressing ${issues[0]}.`;
  }

  if (factors.complexity >= 70 && factors.velocity >= 70) {
    return 'Critical: High complexity file that changes often. Consider refactoring into smaller modules.';
  }

  if (factors.ownership >= 70 && factors.velocity >= 70) {
    return 'Bus factor risk: Frequently modified file with single owner. Encourage knowledge sharing.';
  }

  if (factors.complexity >= 70 && factors.coverage >= 70) {
    return 'Technical debt: Complex file lacking test coverage. Add tests before making changes.';
  }

  return `Address: ${issues.join(', ')}.`;
}

/**
 * Determine risk level from score
 */
function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score < 30) return 'low';
  if (score < 50) return 'medium';
  if (score < 70) return 'high';
  return 'critical';
}

/**
 * Get color for risk level
 */
export function getHotspotColor(riskLevel: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (riskLevel) {
    case 'low': return '#22c55e';
    case 'medium': return '#eab308';
    case 'high': return '#f97316';
    case 'critical': return '#ef4444';
  }
}

/**
 * Get hotspots by category
 */
export function getHotspotsByCategory(
  hotspots: Hotspot[],
  files: FileNode[]
): Map<string, Hotspot[]> {
  const fileMap = new Map(files.map(f => [f.id, f]));
  const categoryMap = new Map<string, Hotspot[]>();

  for (const hotspot of hotspots) {
    const file = fileMap.get(hotspot.fileId);
    const category = file?.category ?? 'unknown';

    const existing = categoryMap.get(category) || [];
    existing.push(hotspot);
    categoryMap.set(category, existing);
  }

  return categoryMap;
}

/**
 * Calculate overall codebase health score
 */
export function calculateCodebaseHealth(hotspots: Hotspot[]): {
  score: number;
  level: 'healthy' | 'moderate' | 'concerning' | 'critical';
  summary: string;
} {
  if (hotspots.length === 0) {
    return {
      score: 100,
      level: 'healthy',
      summary: 'No hotspots detected.',
    };
  }

  // Average hotspot score (inverted: lower hotspot scores = healthier)
  const avgHotspotScore = hotspots.reduce((sum, h) => sum + h.score, 0) / hotspots.length;
  const healthScore = Math.round(100 - avgHotspotScore);

  // Count critical/high risk files
  const criticalCount = hotspots.filter(h => h.riskLevel === 'critical').length;
  const highCount = hotspots.filter(h => h.riskLevel === 'high').length;

  let level: 'healthy' | 'moderate' | 'concerning' | 'critical';
  let summary: string;

  if (criticalCount > 3 || healthScore < 30) {
    level = 'critical';
    summary = `${criticalCount} critical hotspots require immediate attention.`;
  } else if (criticalCount > 0 || highCount > 5 || healthScore < 50) {
    level = 'concerning';
    summary = `${criticalCount + highCount} high-risk files need review.`;
  } else if (highCount > 0 || healthScore < 70) {
    level = 'moderate';
    summary = 'Some technical debt to address.';
  } else {
    level = 'healthy';
    summary = 'Codebase is in good health.';
  }

  return { score: healthScore, level, summary };
}
