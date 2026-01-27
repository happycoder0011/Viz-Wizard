/**
 * Code Search API Route
 *
 * GET /api/analyze/search?q=<query>&limit=<number>&url=<parseltongue-url>
 *
 * Fuzzy search for code entities (functions, classes, etc.) by name.
 */

import { NextResponse } from 'next/server';
import {
  ParseltongueClient,
  ParseltongueError,
  searchEntities,
} from '@/lib/parseltongue';

const DEFAULT_PARSELTONGUE_URL = 'http://localhost:7777';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const parseltongueUrl = searchParams.get('url') || DEFAULT_PARSELTONGUE_URL;

  if (!query) {
    return NextResponse.json(
      { error: 'Missing required parameter: q (query)' },
      { status: 400 }
    );
  }

  try {
    const client = new ParseltongueClient({
      baseUrl: parseltongueUrl,
      timeout: 15000,
    });

    const healthy = await client.healthCheck();
    if (!healthy) {
      return NextResponse.json(
        { error: 'Parseltongue server not available' },
        { status: 503 }
      );
    }

    const results = await searchEntities(client, query, limit);

    return NextResponse.json({
      query,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Search error:', error);

    if (error instanceof ParseltongueError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
