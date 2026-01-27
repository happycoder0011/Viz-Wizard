/**
 * GitHub API Client
 * Fetches repository structure, files, and metadata from GitHub
 */

export interface GitHubFile {
  path: string;
  name: string;
  type: 'file' | 'dir';
  size: number;
  sha: string;
  url: string;
  download_url: string | null;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubRepo {
  id: number;
  owner: string;
  name: string;
  full_name: string;
  default_branch: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  size: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  html_url: string;
  clone_url: string;
  private: boolean;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
}

export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export interface GitHubClientConfig {
  token?: string;
  baseUrl?: string;
}

export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public rateLimit?: GitHubRateLimit
  ) {
    super(message);
    this.name = 'GitHubAPIError';
  }
}

export class GitHubClient {
  private baseUrl: string;
  private token?: string;
  private rateLimit?: GitHubRateLimit;

  constructor(config: GitHubClientConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://api.github.com';
    this.token = config.token;
  }

  /**
   * Get current rate limit status
   */
  getRateLimit(): GitHubRateLimit | undefined {
    return this.rateLimit;
  }

  /**
   * Make authenticated request to a full URL (for external GitHub API calls)
   */
  async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Viz-Wizard',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Update rate limit info
    this.rateLimit = {
      limit: parseInt(response.headers.get('x-ratelimit-limit') || '60'),
      remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '60'),
      reset: parseInt(response.headers.get('x-ratelimit-reset') || '0'),
      used: parseInt(response.headers.get('x-ratelimit-used') || '0'),
    };

    return response;
  }

  /**
   * Make authenticated request to GitHub API
   */
  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Viz-Wizard',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    // Update rate limit info
    this.rateLimit = {
      limit: parseInt(response.headers.get('x-ratelimit-limit') || '60'),
      remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '60'),
      reset: parseInt(response.headers.get('x-ratelimit-reset') || '0'),
      used: parseInt(response.headers.get('x-ratelimit-used') || '0'),
    };

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new GitHubAPIError(
        errorBody.message || `GitHub API error: ${response.status}`,
        response.status,
        this.rateLimit
      );
    }

    return response.json();
  }

  /**
   * Parse GitHub URL to extract owner and repo
   */
  static parseGitHubUrl(url: string): { owner: string; name: string } | null {
    // Handle various GitHub URL formats
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+?)(\.git)?$/,  // https://github.com/owner/repo
      /github\.com\/([^\/]+)\/([^\/]+?)\/?.*/,       // https://github.com/owner/repo/...
      /^([^\/]+)\/([^\/]+)$/,                        // owner/repo
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          owner: match[1],
          name: match[2].replace(/\.git$/, ''),
        };
      }
    }

    return null;
  }

  /**
   * Get repository information
   */
  async getRepoInfo(owner: string, repo: string): Promise<GitHubRepo> {
    const data = await this.fetch<any>(`/repos/${owner}/${repo}`);

    return {
      id: data.id,
      owner: data.owner.login,
      name: data.name,
      full_name: data.full_name,
      default_branch: data.default_branch,
      description: data.description,
      language: data.language,
      stars: data.stargazers_count,
      forks: data.forks_count,
      size: data.size,
      created_at: data.created_at,
      updated_at: data.updated_at,
      pushed_at: data.pushed_at,
      html_url: data.html_url,
      clone_url: data.clone_url,
      private: data.private,
    };
  }

  /**
   * Get repository tree (all files recursively)
   */
  async getTree(
    owner: string,
    repo: string,
    branch?: string
  ): Promise<GitHubTreeItem[]> {
    // Get default branch if not specified
    if (!branch) {
      const repoInfo = await this.getRepoInfo(owner, repo);
      branch = repoInfo.default_branch;
    }

    const data = await this.fetch<{ tree: GitHubTreeItem[]; truncated: boolean }>(
      `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
    );

    if (data.truncated) {
      console.warn('Repository tree was truncated - some files may be missing');
    }

    return data.tree;
  }

  /**
   * Get file content (decoded from base64)
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<string> {
    const params = ref ? `?ref=${ref}` : '';
    const data = await this.fetch<{ content: string; encoding: string }>(
      `/repos/${owner}/${repo}/contents/${path}${params}`
    );

    if (data.encoding === 'base64') {
      // Decode base64 content
      return atob(data.content.replace(/\n/g, ''));
    }

    return data.content;
  }

  /**
   * Get raw file content (direct download)
   */
  async getRawContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<string> {
    const branch = ref || 'HEAD';
    const response = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
    );

    if (!response.ok) {
      throw new GitHubAPIError(
        `Failed to fetch raw content: ${response.status}`,
        response.status
      );
    }

    return response.text();
  }

  /**
   * Get recent commits
   */
  async getCommits(
    owner: string,
    repo: string,
    options: {
      sha?: string;
      path?: string;
      since?: string;
      until?: string;
      perPage?: number;
    } = {}
  ): Promise<GitHubCommit[]> {
    const params = new URLSearchParams();
    if (options.sha) params.set('sha', options.sha);
    if (options.path) params.set('path', options.path);
    if (options.since) params.set('since', options.since);
    if (options.until) params.set('until', options.until);
    params.set('per_page', (options.perPage || 30).toString());

    const data = await this.fetch<any[]>(
      `/repos/${owner}/${repo}/commits?${params}`
    );

    return data.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author,
      committer: commit.commit.committer,
      url: commit.html_url,
    }));
  }

  /**
   * Get languages used in repository
   */
  async getLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    return this.fetch<Record<string, number>>(`/repos/${owner}/${repo}/languages`);
  }

  /**
   * Check if repository exists and is accessible
   */
  async checkAccess(owner: string, repo: string): Promise<boolean> {
    try {
      await this.getRepoInfo(owner, repo);
      return true;
    } catch (error) {
      if (error instanceof GitHubAPIError && error.status === 404) {
        return false;
      }
      throw error;
    }
  }
}

// Export singleton for convenience
export const githubClient = new GitHubClient();
