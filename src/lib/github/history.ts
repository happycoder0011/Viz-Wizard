/**
 * Git History Analysis
 *
 * Fetches and analyzes git commit history from GitHub API
 * to calculate file change velocity, ownership, and hotspots.
 */

import { GitHubClient } from './client';

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  authorEmail?: string;
  authorAvatar?: string;
  date: Date;
  filesChanged: string[];
  additions: number;
  deletions: number;
}

export interface CommitFileChange {
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
  previousFilename?: string;
}

export interface GitHistoryOptions {
  since?: Date;
  until?: Date;
  path?: string;
  maxCommits?: number;
  perPage?: number;
}

/**
 * Fetch commit history for a repository
 */
export async function getCommitHistory(
  client: GitHubClient,
  owner: string,
  repo: string,
  options: GitHistoryOptions = {}
): Promise<CommitInfo[]> {
  const {
    since,
    until,
    path,
    maxCommits = 100,
    perPage = 30,
  } = options;

  const commits: CommitInfo[] = [];
  let page = 1;

  while (commits.length < maxCommits) {
    const params: Record<string, string> = {
      per_page: String(Math.min(perPage, maxCommits - commits.length)),
      page: String(page),
    };

    if (since) params.since = since.toISOString();
    if (until) params.until = until.toISOString();
    if (path) params.path = path;

    const url = `https://api.github.com/repos/${owner}/${repo}/commits?${new URLSearchParams(params)}`;

    const response = await client.fetchWithAuth(url);

    if (!response.ok) {
      if (response.status === 409) {
        // Empty repository
        return [];
      }
      throw new Error(`Failed to fetch commits: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    for (const commit of data) {
      commits.push({
        sha: commit.sha,
        message: commit.commit?.message || '',
        author: commit.commit?.author?.name || commit.author?.login || 'Unknown',
        authorEmail: commit.commit?.author?.email,
        authorAvatar: commit.author?.avatar_url,
        date: new Date(commit.commit?.author?.date || commit.commit?.committer?.date),
        filesChanged: [], // Will be populated if needed
        additions: commit.stats?.additions || 0,
        deletions: commit.stats?.deletions || 0,
      });
    }

    if (data.length < perPage) {
      break;
    }

    page++;
  }

  return commits.slice(0, maxCommits);
}

/**
 * Fetch detailed commit info including files changed
 */
export async function getCommitDetails(
  client: GitHubClient,
  owner: string,
  repo: string,
  sha: string
): Promise<{ commit: CommitInfo; files: CommitFileChange[] }> {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`;
  const response = await client.fetchWithAuth(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch commit details: ${response.status}`);
  }

  const data = await response.json();

  const files: CommitFileChange[] = (data.files || []).map((f: any) => ({
    filename: f.filename,
    status: f.status,
    additions: f.additions || 0,
    deletions: f.deletions || 0,
    changes: f.changes || 0,
    previousFilename: f.previous_filename,
  }));

  return {
    commit: {
      sha: data.sha,
      message: data.commit?.message || '',
      author: data.commit?.author?.name || data.author?.login || 'Unknown',
      authorEmail: data.commit?.author?.email,
      authorAvatar: data.author?.avatar_url,
      date: new Date(data.commit?.author?.date),
      filesChanged: files.map(f => f.filename),
      additions: data.stats?.additions || 0,
      deletions: data.stats?.deletions || 0,
    },
    files,
  };
}

/**
 * Fetch file-level commit history (who changed what)
 * This is more efficient than fetching details for each commit
 */
export async function getFileHistory(
  client: GitHubClient,
  owner: string,
  repo: string,
  filePath: string,
  options: { maxCommits?: number } = {}
): Promise<CommitInfo[]> {
  return getCommitHistory(client, owner, repo, {
    path: filePath,
    maxCommits: options.maxCommits || 50,
  });
}

/**
 * Build a map of file paths to their commit counts and contributors
 * by sampling recent commits
 */
export async function buildFileCommitMap(
  client: GitHubClient,
  owner: string,
  repo: string,
  options: {
    maxCommits?: number;
    since?: Date;
  } = {}
): Promise<Map<string, {
  commitCount: number;
  contributors: Map<string, { commits: number; additions: number; deletions: number }>;
  lastModified: Date;
  totalAdditions: number;
  totalDeletions: number;
}>> {
  const { maxCommits = 100, since } = options;

  // Get recent commits
  const commits = await getCommitHistory(client, owner, repo, {
    maxCommits,
    since,
  });

  const fileMap = new Map<string, {
    commitCount: number;
    contributors: Map<string, { commits: number; additions: number; deletions: number }>;
    lastModified: Date;
    totalAdditions: number;
    totalDeletions: number;
  }>();

  // For each commit, get the files changed
  // Note: We sample commits to avoid rate limits
  const sampleSize = Math.min(commits.length, 50);
  const sampledCommits = commits.slice(0, sampleSize);

  for (const commit of sampledCommits) {
    try {
      const { files } = await getCommitDetails(client, owner, repo, commit.sha);

      for (const file of files) {
        const existing = fileMap.get(file.filename) || {
          commitCount: 0,
          contributors: new Map(),
          lastModified: commit.date,
          totalAdditions: 0,
          totalDeletions: 0,
        };

        existing.commitCount++;
        existing.totalAdditions += file.additions;
        existing.totalDeletions += file.deletions;

        if (commit.date > existing.lastModified) {
          existing.lastModified = commit.date;
        }

        // Track contributor
        const contributor = existing.contributors.get(commit.author) || {
          commits: 0,
          additions: 0,
          deletions: 0,
        };
        contributor.commits++;
        contributor.additions += file.additions;
        contributor.deletions += file.deletions;
        existing.contributors.set(commit.author, contributor);

        fileMap.set(file.filename, existing);
      }
    } catch (error) {
      // Skip commits we can't fetch details for
      console.warn(`Failed to fetch details for commit ${commit.sha}:`, error);
    }
  }

  return fileMap;
}

/**
 * Get contributors for the repository
 */
export async function getContributors(
  client: GitHubClient,
  owner: string,
  repo: string
): Promise<Array<{
  login: string;
  avatar: string;
  contributions: number;
}>> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`;
  const response = await client.fetchWithAuth(url);

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  return data.map((c: any) => ({
    login: c.login,
    avatar: c.avatar_url,
    contributions: c.contributions,
  }));
}
