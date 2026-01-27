/**
 * Find Usages API Route
 *
 * GET /api/analyze/usages?file=<path>&url=<parseltongue-url>
 *
 * Returns usage information for a file:
 * - Which files use (import/call) this file
 * - Which files this file uses
 */

import { NextResponse } from 'next/server';
import {
  ParseltongueClient,
  ParseltongueError,
  getFileUsages,
} from '@/lib/parseltongue';

const DEFAULT_PARSELTONGUE_URL = 'http://localhost:7777';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('file');
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

    const result = await getFileUsages(client, filePath);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Find usages error:', error);

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
