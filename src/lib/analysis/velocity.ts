/**
 * File Velocity Analysis
 *
 * Calculates how frequently files change over time.
 * High velocity + high complexity = high risk.
 */

export interface FileVelocity {
  path: string;
  fileId: string;
  changeCount: number;        // Total changes in period
  changeFrequency: number;    // Changes per week (normalized)
  lastChanged: Date;
  contributors: string[];
  churnScore: number;         // Additions + Deletions (code churn)
  velocityScore: number;      // Normalized 0-100 score
}

export interface VelocityOptions {
  periodDays?: number;        // Analysis period (default: 90 days)
  normalizeBy?: 'max' | 'percentile';  // How to normalize scores
}

/**
 * Calculate velocity metrics for files based on commit data
 */
export function calculateVelocity(
  fileCommitData: Map<string, {
    commitCount: number;
    contributors: Map<string, { commits: number; additions: number; deletions: number }>;
    lastModified: Date;
    totalAdditions: number;
    totalDeletions: number;
  }>,
  options: VelocityOptions = {}
): Map<string, FileVelocity> {
  const { periodDays = 90 } = options;

  const velocityMap = new Map<string, FileVelocity>();
  const weeksInPeriod = periodDays / 7;

  // First pass: calculate raw metrics
  const rawVelocities: FileVelocity[] = [];

  for (const [path, data] of fileCommitData.entries()) {
    const contributors = Array.from(data.contributors.keys());
    const churnScore = data.totalAdditions + data.totalDeletions;
    const changeFrequency = data.commitCount / weeksInPeriod;

    rawVelocities.push({
      path,
      fileId: `file-${path.replace(/[^a-zA-Z0-9]/g, '-')}`,
      changeCount: data.commitCount,
      changeFrequency,
      lastChanged: data.lastModified,
      contributors,
      churnScore,
      velocityScore: 0, // Will be calculated after normalization
    });
  }

  // Find max values for normalization
  const maxChangeCount = Math.max(1, ...rawVelocities.map(v => v.changeCount));
  const maxChurn = Math.max(1, ...rawVelocities.map(v => v.churnScore));

  // Second pass: normalize scores
  for (const velocity of rawVelocities) {
    // Velocity score combines change frequency and churn
    // Weight: 60% change count, 40% churn
    const normalizedChangeCount = (velocity.changeCount / maxChangeCount) * 100;
    const normalizedChurn = (velocity.churnScore / maxChurn) * 100;

    velocity.velocityScore = Math.round(
      normalizedChangeCount * 0.6 + normalizedChurn * 0.4
    );

    velocityMap.set(velocity.path, velocity);
  }

  return velocityMap;
}

/**
 * Get top N files by velocity
 */
export function getHighVelocityFiles(
  velocityMap: Map<string, FileVelocity>,
  topN: number = 20
): FileVelocity[] {
  return Array.from(velocityMap.values())
    .sort((a, b) => b.velocityScore - a.velocityScore)
    .slice(0, topN);
}

/**
 * Get files that haven't changed recently (potentially stale)
 */
export function getStaleFiles(
  velocityMap: Map<string, FileVelocity>,
  staleDays: number = 180
): FileVelocity[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - staleDays);

  return Array.from(velocityMap.values())
    .filter(v => v.lastChanged < cutoffDate)
    .sort((a, b) => a.lastChanged.getTime() - b.lastChanged.getTime());
}

/**
 * Categorize velocity level
 */
export function getVelocityLevel(score: number): {
  level: 'low' | 'medium' | 'high' | 'very-high';
  label: string;
  color: string;
} {
  if (score < 25) {
    return { level: 'low', label: 'Stable', color: '#22c55e' };
  }
  if (score < 50) {
    return { level: 'medium', label: 'Moderate', color: '#eab308' };
  }
  if (score < 75) {
    return { level: 'high', label: 'Active', color: '#f97316' };
  }
  return { level: 'very-high', label: 'Volatile', color: '#ef4444' };
}
