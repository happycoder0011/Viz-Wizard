/**
 * Code Ownership Analysis
 *
 * Determines who owns which files based on commit history.
 * Low ownership concentration = higher risk (bus factor).
 */

export interface Contributor {
  name: string;
  commits: number;
  linesChanged: number;
  percentage: number;          // Percentage of total commits
  lastContribution: Date;
}

export interface FileOwnership {
  path: string;
  fileId: string;
  primaryOwner: string;        // Most commits
  primaryOwnerPercentage: number;
  contributors: Contributor[];
  totalCommits: number;
  ownershipScore: number;      // 0-100, higher = more concentrated ownership
  busFactor: number;           // Number of contributors with >10% ownership
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Calculate ownership metrics for files
 */
export function calculateOwnership(
  fileCommitData: Map<string, {
    commitCount: number;
    contributors: Map<string, { commits: number; additions: number; deletions: number }>;
    lastModified: Date;
    totalAdditions: number;
    totalDeletions: number;
  }>
): Map<string, FileOwnership> {
  const ownershipMap = new Map<string, FileOwnership>();

  for (const [path, data] of fileCommitData.entries()) {
    const totalCommits = data.commitCount;
    if (totalCommits === 0) continue;

    // Build contributor list
    const contributors: Contributor[] = [];
    let maxCommits = 0;
    let primaryOwner = 'Unknown';

    for (const [name, stats] of data.contributors.entries()) {
      const percentage = (stats.commits / totalCommits) * 100;

      contributors.push({
        name,
        commits: stats.commits,
        linesChanged: stats.additions + stats.deletions,
        percentage,
        lastContribution: data.lastModified, // Approximation
      });

      if (stats.commits > maxCommits) {
        maxCommits = stats.commits;
        primaryOwner = name;
      }
    }

    // Sort by commits descending
    contributors.sort((a, b) => b.commits - a.commits);

    // Calculate ownership score (concentration)
    // Higher score = more concentrated = single owner (can be good or bad)
    const primaryOwnerPercentage = (maxCommits / totalCommits) * 100;

    // Ownership score: how concentrated is the ownership?
    // 100 = single owner, 0 = evenly distributed
    const ownershipScore = calculateConcentrationScore(contributors);

    // Bus factor: how many people have significant ownership (>10%)
    const busFactor = contributors.filter(c => c.percentage >= 10).length;

    // Risk level based on bus factor
    let riskLevel: 'low' | 'medium' | 'high';
    if (busFactor >= 3) {
      riskLevel = 'low';
    } else if (busFactor >= 2) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'high'; // Single point of failure
    }

    ownershipMap.set(path, {
      path,
      fileId: `file-${path.replace(/[^a-zA-Z0-9]/g, '-')}`,
      primaryOwner,
      primaryOwnerPercentage,
      contributors,
      totalCommits,
      ownershipScore,
      busFactor,
      riskLevel,
    });
  }

  return ownershipMap;
}

/**
 * Calculate concentration score using Herfindahl-Hirschman Index (HHI)
 * normalized to 0-100 scale
 */
function calculateConcentrationScore(contributors: Contributor[]): number {
  if (contributors.length === 0) return 0;
  if (contributors.length === 1) return 100;

  // HHI = sum of squared market shares
  const hhi = contributors.reduce((sum, c) => {
    const share = c.percentage / 100;
    return sum + (share * share);
  }, 0);

  // Normalize: min HHI = 1/n, max HHI = 1
  // Scale to 0-100
  const minHHI = 1 / contributors.length;
  const normalizedHHI = (hhi - minHHI) / (1 - minHHI);

  return Math.round(normalizedHHI * 100);
}

/**
 * Get files with high ownership risk (low bus factor)
 */
export function getHighRiskOwnershipFiles(
  ownershipMap: Map<string, FileOwnership>
): FileOwnership[] {
  return Array.from(ownershipMap.values())
    .filter(o => o.riskLevel === 'high')
    .sort((a, b) => a.busFactor - b.busFactor);
}

/**
 * Get files owned by a specific contributor
 */
export function getFilesByOwner(
  ownershipMap: Map<string, FileOwnership>,
  ownerName: string
): FileOwnership[] {
  return Array.from(ownershipMap.values())
    .filter(o => o.primaryOwner === ownerName)
    .sort((a, b) => b.primaryOwnerPercentage - a.primaryOwnerPercentage);
}

/**
 * Get unique contributors across all files
 */
export function getUniqueContributors(
  ownershipMap: Map<string, FileOwnership>
): Array<{
  name: string;
  filesOwned: number;
  totalCommits: number;
}> {
  const contributorMap = new Map<string, { filesOwned: number; totalCommits: number }>();

  for (const ownership of ownershipMap.values()) {
    for (const contributor of ownership.contributors) {
      const existing = contributorMap.get(contributor.name) || {
        filesOwned: 0,
        totalCommits: 0,
      };

      if (contributor.name === ownership.primaryOwner) {
        existing.filesOwned++;
      }
      existing.totalCommits += contributor.commits;

      contributorMap.set(contributor.name, existing);
    }
  }

  return Array.from(contributorMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.filesOwned - a.filesOwned);
}

/**
 * Get ownership risk color
 */
export function getOwnershipRiskColor(riskLevel: 'low' | 'medium' | 'high'): string {
  switch (riskLevel) {
    case 'low': return '#22c55e';
    case 'medium': return '#eab308';
    case 'high': return '#ef4444';
  }
}
