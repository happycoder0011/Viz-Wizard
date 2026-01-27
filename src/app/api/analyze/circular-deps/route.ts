/**
 * Circular Dependencies API Route
 *
 * GET /api/analyze/circular-deps?url=<parseltongue-url>
 *
 * Detects circular dependencies in the codebase.
 */

import { NextResponse } from 'next/server';
import {
  ParseltongueClient,
  ParseltongueError,
  getCircularDependencies,
} from '@/lib/parseltongue';

const DEFAULT_PARSELTONGUE_URL = 'http://localhost:7777';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parseltongueUrl = searchParams.get('url') || DEFAULT_PARSELTONGUE_URL;

  try {
    const client = new ParseltongueClient({
      baseUrl: parseltongueUrl,
      timeout: 60000, // Circular dep detection can be slow
    });

    const healthy = await client.healthCheck();
    if (!healthy) {
      return NextResponse.json(
        { error: 'Parseltongue server not available' },
        { status: 503 }
      );
    }

    const circularDeps = await getCircularDependencies(client);

    return NextResponse.json({
      circularDependencies: circularDeps,
      count: circularDeps.length,
      hasCycles: circularDeps.length > 0,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Circular dependency detection error:', error);

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
