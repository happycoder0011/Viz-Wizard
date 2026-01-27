import { NextRequest, NextResponse } from 'next/server';
import { GitHubClient, GitHubAPIError, GitHubTreeItem } from '@/lib/github/client';
import { FileNode, FileCategory, Connection, RepositoryData } from '@/types/repository';
import {
  ParseltongueClient,
  mergeGitHubWithParseltongue,
  getCriticalPathFiles,
  type CriticalPathScore,
} from '@/lib/parseltongue';

// Simple in-memory cache (replace with KV in production)
const cache = new Map<string, { data: RepositoryData; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Default Parseltongue server URL
const DEFAULT_PARSELTONGUE_URL = 'http://localhost:7777';

/**
 * Determine file category based on path and extension
 */
function categorizeFile(path: string, extension: string): FileCategory {
  const lowerPath = path.toLowerCase();
  const lowerExt = extension.toLowerCase();

  // Test files
  if (
    lowerPath.includes('test') ||
    lowerPath.includes('spec') ||
    lowerPath.includes('__tests__') ||
    lowerExt === 'test.ts' ||
    lowerExt === 'spec.ts'
  ) {
    return 'test';
  }

  // Style files
  if (['css', 'scss', 'sass', 'less', 'styl'].includes(lowerExt)) {
    return 'style';
  }

  // Config files
  if (
    lowerPath.includes('config') ||
    ['json', 'yaml', 'yml', 'toml', 'ini', 'env'].includes(lowerExt) ||
    lowerPath.includes('.config.') ||
    lowerPath.endsWith('rc') ||
    lowerPath.endsWith('rc.js') ||
    lowerPath.endsWith('rc.ts')
  ) {
    return 'config';
  }

  // Documentation
  if (['md', 'mdx', 'txt', 'rst', 'adoc'].includes(lowerExt)) {
    return 'docs';
  }

  // Legacy patterns (simple heuristic)
  if (
    lowerPath.includes('legacy') ||
    lowerPath.includes('deprecated') ||
    lowerPath.includes('old')
  ) {
    return 'legacy';
  }

  // Default to core
  return 'core';
}

/**
 * Get language from file extension
 */
function getLanguage(extension: string): string {
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    rb: 'ruby',
    php: 'php',
    cs: 'csharp',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
  };

  return langMap[extension.toLowerCase()] || extension;
}

/**
 * Estimate complexity based on file size (simplified)
 * In production, this would use actual parsing
 */
function estimateComplexity(size: number): number {
  // Rough estimate: larger files tend to be more complex
  // This is a placeholder until we integrate Parseltongue
  if (size < 1000) return Math.floor(Math.random() * 30) + 10; // 10-40
  if (size < 5000) return Math.floor(Math.random() * 30) + 30; // 30-60
  if (size < 10000) return Math.floor(Math.random() * 25) + 50; // 50-75
  return Math.floor(Math.random() * 20) + 70; // 70-90
}

/**
 * Transform GitHub tree to Viz-Wizard FileNodes
 */
function treeToFileNodes(tree: GitHubTreeItem[]): FileNode[] {
  const files: FileNode[] = [];
  const supportedExtensions = new Set([
    'ts', 'tsx', 'js', 'jsx', 'py', 'rs', 'go', 'java', 'c', 'cpp', 'h', 'hpp',
    'rb', 'php', 'cs', 'swift', 'kt', 'scala', 'css', 'scss', 'html', 'json',
    'yaml', 'yml', 'md', 'sql', 'sh', 'bash',
  ]);

  for (const item of tree) {
    // Only process files (blobs), not directories
    if (item.type !== 'blob') continue;

    // Get file extension
    const parts = item.path.split('.');
    const extension = parts.length > 1 ? parts.pop()! : '';

    // Skip unsupported or binary files
    if (!supportedExtensions.has(extension.toLowerCase())) continue;

    // Skip common non-code files
    if (
      item.path.includes('node_modules/') ||
      item.path.includes('vendor/') ||
      item.path.includes('.git/') ||
      item.path.includes('dist/') ||
      item.path.includes('build/') ||
      item.path.includes('.next/') ||
      item.path.includes('coverage/')
    ) continue;

    const name = item.path.split('/').pop() || item.path;
    const size = item.size || 0;

    files.push({
      id: item.sha,
      name,
      path: item.path,
      extension,
      lineCount: Math.ceil(size / 40), // Rough estimate: ~40 chars per line
      complexity: estimateComplexity(size),
      category: categorizeFile(item.path, extension),
      language: getLanguage(extension),
    });
  }

  return files;
}

/**
 * Generate simple connections based on directory structure
 * In production, this would use Parseltongue for real dependency analysis
 */
function generateConnections(files: FileNode[]): Connection[] {
  const connections: Connection[] = [];
  const filesByDir = new Map<string, FileNode[]>();

  // Group files by directory
  for (const file of files) {
    const dir = file.path.split('/').slice(0, -1).join('/') || '/';
    const existing = filesByDir.get(dir) || [];
    existing.push(file);
    filesByDir.set(dir, existing);
  }

  // Create connections between files in the same directory
  // This is a placeholder until Parseltongue provides real import analysis
  let connectionId = 0;
  for (const [_dir, dirFiles] of filesByDir) {
    // Connect files in same directory (simplified)
    for (let i = 0; i < dirFiles.length && i < 5; i++) {
      for (let j = i + 1; j < dirFiles.length && j < i + 3; j++) {
        // Only connect code files
        if (dirFiles[i].category === 'core' && dirFiles[j].category === 'core') {
          connections.push({
            id: `conn-${connectionId++}`,
            sourceId: dirFiles[i].id,
            targetId: dirFiles[j].id,
            type: 'import',
            weight: 1,
          });
        }
      }
    }
  }

  return connections;
}

/**
 * Try to enhance repository data with Parseltongue analysis
 * Returns null if Parseltongue is not available
 */
async function tryParseltongueEnhancement(
  files: FileNode[],
  parseltongueUrl: string
): Promise<{
  enhancedFiles: FileNode[];
  enhancedConnections: Connection[];
  criticalPath: CriticalPathScore[];
} | null> {
  try {
    const ptClient = new ParseltongueClient({
      baseUrl: parseltongueUrl,
      timeout: 30000,
    });

    // Check if Parseltongue is available
    const healthy = await ptClient.healthCheck();
    if (!healthy) {
      return null;
    }

    // Fetch Parseltongue data
    const [graphData, hotspots] = await Promise.all([
      ptClient.getEntitiesWithRelationships(),
      ptClient.getHotspots(100),
    ]);

    const { entities, dependencies } = graphData;

    // If no entities, Parseltongue hasn't indexed this repo
    if (entities.length === 0) {
      return null;
    }

    // Merge GitHub files with Parseltongue analysis
    const { files: enhancedFiles, connections: enhancedConnections } =
      mergeGitHubWithParseltongue(files, entities, dependencies, hotspots);

    // Get critical path scores
    const criticalPath = await getCriticalPathFiles(ptClient, 20);

    return {
      enhancedFiles,
      enhancedConnections,
      criticalPath,
    };
  } catch (error) {
    // Parseltongue not available or error - fall back to basic analysis
    console.log('Parseltongue enhancement not available:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * GET /api/repo/[owner]/[name]
 * Fetch and analyze a GitHub repository
 *
 * Query params:
 * - parseltongue: URL of Parseltongue server (default: http://localhost:7777)
 * - skipParseltongue: Set to 'true' to skip Parseltongue enhancement
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  const { owner, name } = await params;
  const { searchParams } = new URL(request.url);
  const parseltongueUrl = searchParams.get('parseltongue') || DEFAULT_PARSELTONGUE_URL;
  const skipParseltongue = searchParams.get('skipParseltongue') === 'true';

  const cacheKey = `${owner}/${name}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: { 'X-Cache': 'HIT' },
    });
  }

  try {
    // Get GitHub token from environment or request header
    const token = process.env.GITHUB_TOKEN ||
      request.headers.get('x-github-token') ||
      undefined;

    const client = new GitHubClient({ token });

    // Fetch repo info and tree in parallel
    const [repoInfo, tree, languages] = await Promise.all([
      client.getRepoInfo(owner, name),
      client.getTree(owner, name),
      client.getLanguages(owner, name),
    ]);

    // Transform to Viz-Wizard format (basic analysis)
    let files = treeToFileNodes(tree);
    let connections = generateConnections(files);
    let criticalPath: CriticalPathScore[] = [];
    let analysisSource: 'github' | 'parseltongue' = 'github';

    // Try to enhance with Parseltongue if not skipped
    if (!skipParseltongue) {
      const enhancement = await tryParseltongueEnhancement(files, parseltongueUrl);
      if (enhancement) {
        files = enhancement.enhancedFiles;
        connections = enhancement.enhancedConnections;
        criticalPath = enhancement.criticalPath;
        analysisSource = 'parseltongue';
      }
    }

    // Calculate stats
    const stats = {
      totalFiles: files.length,
      totalLines: files.reduce((sum, f) => sum + f.lineCount, 0),
      totalDirectories: new Set(files.map(f => f.path.split('/').slice(0, -1).join('/'))).size,
      languages,
      avgComplexity: files.length > 0
        ? files.reduce((sum, f) => sum + f.complexity, 0) / files.length
        : 0,
    };

    const repositoryData: RepositoryData & {
      analysis?: {
        source: string;
        criticalPath: CriticalPathScore[];
        parseltongueUrl?: string;
      };
    } = {
      owner: repoInfo.owner,
      name: repoInfo.name,
      description: repoInfo.description || undefined,
      defaultBranch: repoInfo.default_branch,
      stars: repoInfo.stars,
      forks: repoInfo.forks,
      allFiles: files,
      connections,
      stats,
      analysis: {
        source: analysisSource,
        criticalPath,
        parseltongueUrl: analysisSource === 'parseltongue' ? parseltongueUrl : undefined,
      },
    };

    // Cache the result
    cache.set(cacheKey, {
      data: repositoryData,
      timestamp: Date.now(),
    });

    return NextResponse.json(repositoryData, {
      headers: {
        'X-Cache': 'MISS',
        'X-Analysis-Source': analysisSource,
        'X-RateLimit-Remaining': client.getRateLimit()?.remaining.toString() || 'unknown',
      },
    });
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      if (error.status === 404) {
        return NextResponse.json(
          { error: 'Repository not found', details: `${owner}/${name} does not exist or is private` },
          { status: 404 }
        );
      }
      if (error.status === 403 && error.rateLimit?.remaining === 0) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            details: 'GitHub API rate limit reached. Try again later or provide a GitHub token.',
            resetAt: error.rateLimit.reset,
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error('Error fetching repository:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repository' },
      { status: 500 }
    );
  }
}
