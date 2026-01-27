/**
 * Critical Path Radar - Risk Calculation Logic
 *
 * Identifies the files that are most likely to cause problems:
 * - High coupling (many dependencies)
 * - High complexity
 * - High velocity (frequently changed)
 * - Low test coverage
 */

import { FileNode, Connection } from '@/types/repository';

export interface CriticalPathScore {
  fileId: string;
  fileName: string;
  filePath: string;
  category: string;
  couplingScore: number;      // 0-100: inbound + outbound connections
  complexityScore: number;    // 0-100: from existing complexity metric
  velocityScore: number;      // 0-100: change frequency (mock for now)
  coverageScore: number;      // 0-100: inverse test coverage (high = risky)
  overallRisk: number;        // Weighted combination
  factors: string[];          // Human-readable explanations
}

/**
 * Calculate risk score for a single file
 * @param velocityData Optional map of file paths to velocity scores (from git history)
 */
export function calculateFileRisk(
  file: FileNode,
  connections: Connection[],
  allFiles: FileNode[],
  velocityData?: Map<string, number>
): CriticalPathScore {
  const factors: string[] = [];

  // 1. Coupling Score: How connected is this file?
  const inboundConnections = connections.filter(c => c.targetId === file.id && c.type !== 'directory');
  const outboundConnections = connections.filter(c => c.sourceId === file.id && c.type !== 'directory');
  const totalConnections = inboundConnections.length + outboundConnections.length;

  // Scale: 0 connections = 0, 20+ connections = 100
  const couplingScore = Math.min(100, totalConnections * 5);

  if (inboundConnections.length >= 5) {
    factors.push(`${inboundConnections.length} files depend on this`);
  }
  if (outboundConnections.length >= 5) {
    factors.push(`Depends on ${outboundConnections.length} files`);
  }

  // 2. Complexity Score: Already have this from file data
  const complexityScore = file.complexity;

  if (complexityScore >= 70) {
    factors.push('Very high complexity');
  } else if (complexityScore >= 50) {
    factors.push('High complexity');
  }

  // 3. Velocity Score: How often is this file changed?
  // Use real git history data if available, otherwise estimate
  let velocityScore: number;
  if (velocityData && velocityData.has(file.path)) {
    velocityScore = velocityData.get(file.path)!;
  } else {
    // Estimate based on file size and complexity (larger/complex files tend to change more)
    velocityScore = Math.min(100, Math.round(
      (file.lineCount / 10) + (file.complexity * 0.5) + (Math.random() * 20)
    ));
  }

  if (velocityScore >= 60) {
    factors.push('Frequently modified');
  }

  // 4. Coverage Score: Does this file have tests?
  // Check if any test file imports this file
  const hasTests = connections.some(c => {
    if (c.targetId !== file.id) return false;
    const sourceFile = allFiles.find(f => f.id === c.sourceId);
    return sourceFile?.category === 'test';
  });

  // Also check if this file itself is a test (low risk)
  const isTestFile = file.category === 'test';

  let coverageScore: number;
  if (isTestFile) {
    coverageScore = 10; // Test files are low risk
  } else if (hasTests) {
    coverageScore = 30; // Has tests = lower risk
  } else {
    coverageScore = 80; // No tests = high risk
    factors.push('No test coverage');
  }

  // 5. File type risk adjustments
  if (file.category === 'config') {
    // Config files are high risk - changes affect everything
    factors.push('Configuration file');
  }
  if (file.name.toLowerCase().includes('index')) {
    // Index/barrel files often have high coupling
    if (couplingScore < 50) {
      // Boost coupling score for index files
    }
  }

  // Calculate weighted overall risk
  const overallRisk = Math.round(
    couplingScore * 0.35 +
    complexityScore * 0.30 +
    velocityScore * 0.20 +
    coverageScore * 0.15
  );

  // Add overall risk level to factors
  if (overallRisk >= 70) {
    factors.unshift('Critical risk level');
  } else if (overallRisk >= 50) {
    factors.unshift('High risk level');
  }

  return {
    fileId: file.id,
    fileName: file.name,
    filePath: file.path,
    category: file.category,
    couplingScore,
    complexityScore,
    velocityScore,
    coverageScore,
    overallRisk,
    factors,
  };
}

/**
 * Calculate risk scores for all files and return top N critical files
 * @param velocityData Optional map of file paths to velocity scores (from git history)
 */
export function calculateCriticalPath(
  files: FileNode[],
  connections: Connection[],
  topN: number = 10,
  velocityData?: Map<string, number>
): CriticalPathScore[] {
  // Calculate risk for all non-test, non-config files
  // (or include them but they'll naturally score lower)
  const scores = files
    .filter(f => f.category !== 'docs') // Exclude documentation
    .map(file => calculateFileRisk(file, connections, files, velocityData));

  // Sort by overall risk (descending) and take top N
  return scores
    .sort((a, b) => b.overallRisk - a.overallRisk)
    .slice(0, topN);
}

/**
 * Get risk level label
 */
export function getRiskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

/**
 * Get risk level color
 */
export function getRiskColor(score: number): string {
  if (score >= 70) return '#ff4444'; // Red
  if (score >= 50) return '#ffaa00'; // Orange/Amber
  if (score >= 30) return '#ffff00'; // Yellow
  return '#00ff88'; // Green
}
