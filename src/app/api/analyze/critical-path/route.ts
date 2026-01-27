/**
 * Critical Path API Route
 *
 * GET /api/analyze/critical-path?top=<number>&url=<parseltongue-url>
 *
 * Returns the most critical/risky files in the codebase based on:
 * - Complexity score
 * - Connection count (coupling)
 * - Change velocity (if git data available)
 */

import { NextResponse } from 'next/server';
import {
  ParseltongueClient,
  ParseltongueError,
  getCriticalPathFiles,
} from '@/lib/parseltongue';

const DEFAULT_PARSELTONGUE_URL = 'http://localhost:7777';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const top = parseInt(searchParams.get('top') || '10', 10);
  const parseltongueUrl = searchParams.get('url') || DEFAULT_PARSELTONGUE_URL;

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

    const criticalPath = await getCriticalPathFiles(client, top);

    return NextResponse.json({
      criticalPath,
      count: criticalPath.length,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Critical path error:', error);

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
