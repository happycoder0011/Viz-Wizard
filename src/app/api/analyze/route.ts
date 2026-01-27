/**
 * Parseltongue Analysis API Route
 *
 * POST /api/analyze
 *
 * Connects to a Parseltongue server and returns analyzed repository data.
 * This endpoint can work with:
 * 1. A local Parseltongue server (user runs on their machine)
 * 2. A cloud-hosted Parseltongue instance
 *
 * Request body:
 * {
 *   parseltongueUrl?: string;  // Default: http://localhost:7777
 *   repoName?: string;         // Optional: name for the repository
 *   repoOwner?: string;        // Optional: owner name
 * }
 *
 * Response:
 * - 200: RepositoryData JSON
 * - 503: Parseltongue server not available
 * - 500: Analysis failed
 */

import { NextResponse } from 'next/server';
import {
  ParseltongueClient,
  ParseltongueError,
  buildRepositoryData,
  getCriticalPathFiles,
  getCircularDependencies,
} from '@/lib/parseltongue';

const DEFAULT_PARSELTONGUE_URL = 'http://localhost:7777';

interface AnalyzeRequest {
  parseltongueUrl?: string;
  repoName?: string;
  repoOwner?: string;
}

export async function POST(request: Request) {
  try {
    const body: AnalyzeRequest = await request.json();
    const {
      parseltongueUrl = DEFAULT_PARSELTONGUE_URL,
      repoName = 'local-repo',
      repoOwner = 'local',
    } = body;

    // Create Parseltongue client
    const client = new ParseltongueClient({
      baseUrl: parseltongueUrl,
      timeout: 60000, // 60 second timeout for large repos
    });

    // Verify connection
    const healthy = await client.healthCheck();
    if (!healthy) {
      return NextResponse.json(
        {
          error: 'Parseltongue server not available',
          details: `Could not connect to ${parseltongueUrl}`,
          hint: 'Make sure Parseltongue is running. Start with: parseltongue pt08-http-code-query-server --db "rocksdb:./data/yourrepo.db" --port 7777',
        },
        { status: 503 }
      );
    }

    // Fetch all data from Parseltongue in parallel
    const [stats, hotspots, graphData] = await Promise.all([
      client.getStats(),
      client.getHotspots(100), // Get top 100 hotspots
      client.getEntitiesWithRelationships(),
    ]);

    const { entities, dependencies } = graphData;

    // Build repository data
    const repoData = buildRepositoryData(
      { owner: repoOwner, name: repoName },
      entities,
      dependencies,
      hotspots,
      stats
    );

    // Optionally fetch circular dependencies (can be slow for large repos)
    let circularDeps: Awaited<ReturnType<typeof getCircularDependencies>> = [];
    try {
      circularDeps = await getCircularDependencies(client);
    } catch {
      // Non-fatal - circular dep detection might not be available
      circularDeps = [];
    }

    // Fetch critical path scores
    let criticalPath: Awaited<ReturnType<typeof getCriticalPathFiles>> = [];
    try {
      criticalPath = await getCriticalPathFiles(client, 20);
    } catch {
      criticalPath = [];
    }

    return NextResponse.json({
      ...repoData,
      analysis: {
        circularDependencies: circularDeps,
        criticalPath,
        analyzedAt: new Date().toISOString(),
        parseltongueUrl,
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);

    if (error instanceof ParseltongueError) {
      return NextResponse.json(
        {
          error: 'Parseltongue analysis failed',
          details: error.message,
          endpoint: error.endpoint,
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analyze
 *
 * Check if Parseltongue is available and return server info.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parseltongueUrl = searchParams.get('url') || DEFAULT_PARSELTONGUE_URL;

  const client = new ParseltongueClient({
    baseUrl: parseltongueUrl,
    timeout: 5000,
  });

  const healthy = await client.healthCheck();

  if (!healthy) {
    return NextResponse.json(
      {
        available: false,
        url: parseltongueUrl,
        message: 'Parseltongue server not responding',
      },
      { status: 503 }
    );
  }

  // Get basic stats
  try {
    const stats = await client.getStats();
    return NextResponse.json({
      available: true,
      url: parseltongueUrl,
      stats: {
        totalFiles: stats.total_files,
        totalEntities: stats.total_entities,
        totalEdges: stats.total_edges,
        languages: Object.keys(stats.languages),
      },
    });
  } catch {
    return NextResponse.json({
      available: true,
      url: parseltongueUrl,
      stats: null,
      message: 'Server available but no indexed codebase',
    });
  }
}
