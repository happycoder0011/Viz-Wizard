/**
 * Git History Analysis API Route
 *
 * GET /api/repo/[owner]/[name]/history
 *
 * Fetches git commit history and calculates:
 * - File velocity (change frequency)
 * - Code ownership
 * - Hotspots (combining complexity + velocity + ownership)
 *
 * Query params:
 * - days: Analysis period in days (default: 90)
 * - maxCommits: Max commits to analyze (default: 100)
 */

import { NextRequest, NextResponse } from 'next/server';
import { GitHubClient, GitHubAPIError } from '@/lib/github/client';
import { buildFileCommitMap, getContributors } from '@/lib/github/history';
import {
  calculateVelocity,
  calculateOwnership,
  detectHotspots,
  calculateCodebaseHealth,
  getHighVelocityFiles,
  getHighRiskOwnershipFiles,
  getUniqueContributors,
} from '@/lib/analysis';

// Cache for git history analysis (expensive operation)
const historyCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  const { owner, name } = await params;
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '90', 10);
  const maxCommits = parseInt(searchParams.get('maxCommits') || '100', 10);

  const cacheKey = `${owner}/${name}:${days}:${maxCommits}`;

  // Check cache
  const cached = historyCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: { 'X-Cache': 'HIT' },
    });
  }

  try {
    const token = process.env.GITHUB_TOKEN ||
      request.headers.get('x-github-token') ||
      undefined;

    const client = new GitHubClient({ token });

    // Calculate since date
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Fetch file commit data (this makes multiple API calls)
    const fileCommitData = await buildFileCommitMap(client, owner, name, {
      maxCommits,
      since,
    });

    // Fetch contributors
    const contributors = await getContributors(client, owner, name);

    // Calculate velocity
    const velocityMap = calculateVelocity(fileCommitData, { periodDays: days });

    // Calculate ownership
    const ownershipMap = calculateOwnership(fileCommitData);

    // Get high velocity files
    const highVelocityFiles = getHighVelocityFiles(velocityMap, 10);

    // Get high risk ownership files
    const highRiskOwnershipFiles = getHighRiskOwnershipFiles(ownershipMap);

    // Get unique contributors summary
    const contributorsSummary = getUniqueContributors(ownershipMap);

    // Prepare response
    const result = {
      repository: { owner, name },
      analysisPeriod: {
        days,
        since: since.toISOString(),
        until: new Date().toISOString(),
      },
      summary: {
        filesAnalyzed: fileCommitData.size,
        totalContributors: contributors.length,
        commitsAnalyzed: maxCommits,
      },
      velocity: {
        highVelocityFiles: highVelocityFiles.map(v => ({
          path: v.path,
          fileId: v.fileId,
          changeCount: v.changeCount,
          velocityScore: v.velocityScore,
          contributors: v.contributors,
          lastChanged: v.lastChanged.toISOString(),
        })),
      },
      ownership: {
        highRiskFiles: highRiskOwnershipFiles.slice(0, 10).map(o => ({
          path: o.path,
          fileId: o.fileId,
          primaryOwner: o.primaryOwner,
          busFactor: o.busFactor,
          riskLevel: o.riskLevel,
          contributors: o.contributors.slice(0, 5),
        })),
        topContributors: contributorsSummary.slice(0, 10),
      },
      contributors: contributors.slice(0, 20),
      // Include raw maps for frontend processing
      velocityData: Object.fromEntries(
        Array.from(velocityMap.entries()).map(([path, v]) => [
          path,
          {
            velocityScore: v.velocityScore,
            changeCount: v.changeCount,
            churnScore: v.churnScore,
            lastChanged: v.lastChanged.toISOString(),
          },
        ])
      ),
      ownershipData: Object.fromEntries(
        Array.from(ownershipMap.entries()).map(([path, o]) => [
          path,
          {
            primaryOwner: o.primaryOwner,
            busFactor: o.busFactor,
            ownershipScore: o.ownershipScore,
            riskLevel: o.riskLevel,
          },
        ])
      ),
      analyzedAt: new Date().toISOString(),
    };

    // Cache the result
    historyCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return NextResponse.json(result, {
      headers: {
        'X-Cache': 'MISS',
        'X-RateLimit-Remaining': client.getRateLimit()?.remaining.toString() || 'unknown',
      },
    });
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      if (error.status === 404) {
        return NextResponse.json(
          { error: 'Repository not found' },
          { status: 404 }
        );
      }
      if (error.status === 403 && error.rateLimit?.remaining === 0) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
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

    console.error('Error fetching git history:', error);
    return NextResponse.json(
      { error: 'Failed to analyze git history' },
      { status: 500 }
    );
  }
}
