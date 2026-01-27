/**
 * Blast Radius API Route
 *
 * GET /api/analyze/blast-radius?file=<path>&hops=<number>&url=<parseltongue-url>
 *
 * Returns the blast radius (impact analysis) for a specific file.
 * Shows all files that would be affected if this file changes.
 */

import { NextResponse } from 'next/server';
import {
  ParseltongueClient,
  ParseltongueError,
  getBlastRadiusForFile,
} from '@/lib/parseltongue';

const DEFAULT_PARSELTONGUE_URL = 'http://localhost:7777';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('file');
  const hops = parseInt(searchParams.get('hops') || '3', 10);
  const parseltongueUrl = searchParams.get('url') || DEFAULT_PARSELTONGUE_URL;

  if (!filePath) {
    return NextResponse.json(
      { error: 'Missing required parameter: file' },
      { status: 400 }
    );
  }

  try {
    const client = new ParseltongueClient({
      baseUrl: parseltongueUrl,
      timeout: 30000,
    });

    const healthy = await client.healthCheck();
    if (!healthy) {
      return NextResponse.json(
        { error: 'Parseltongue server not available' },
        { status: 503 }
      );
    }

    const result = await getBlastRadiusForFile(client, filePath, hops);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Blast radius error:', error);

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
