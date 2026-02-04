# Viz-Wizard Backend Implementation Plan

## Overview

Transform Viz-Wizard from a mock-data demo into a production-ready tool that can analyze **any GitHub repository** in real-time.

### Current State (Frontend Only)
- Mock repository data with hardcoded files
- Client-side AI calls (BYOK pattern)
- No persistence
- No real repository analysis

### Target State (Full Stack)
- Fetch and analyze any GitHub repository
- Real complexity metrics, dependencies, and git history
- Secure AI integration with optional BYOK
- Persistent storage for analyzed repositories
- Real-time collaboration features

---

## Key Integration: Parseltongue

We will leverage **[Parseltongue](https://github.com/that-in-rust/parseltongue-dependency-graph-generator)** for code analysis instead of building from scratch.

### What Parseltongue Provides

| Feature | Endpoint | Viz-Wizard Use Case |
|---------|----------|---------------------|
| Entity search | `/code-entities-search-fuzzy?q=X` | Building search/filter |
| Reverse callers | `/reverse-callers-query-graph?entity=X` | "Find Usages" feature |
| Blast radius | `/blast-radius-impact-analysis?entity=X&hops=N` | Impact visualization |
| Circular deps | `/circular-dependency-detection-scan` | Highlight cycles |
| Hotspots | `/complexity-hotspots-ranking-view?top=N` | Critical Path Radar |
| Statistics | `/codebase-statistics-overview-summary` | Header stats |

### Supported Languages (12)
Rust, Python, JavaScript, TypeScript, Go, Java, C, C++, Ruby, PHP, C#, Swift

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       VIZ-WIZARD FRONTEND                           │
│  Next.js + React Three Fiber                                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       VIZ-WIZARD API LAYER                          │
│  Next.js API Routes / Cloudflare Workers                            │
│  - Transform Parseltongue responses → Viz-Wizard format             │
│  - Caching layer                                                     │
│  - Authentication                                                    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       PARSELTONGUE SERVER                           │
│  Rust HTTP Server (port 7777)                                       │
│  - Tree-sitter parsing                                              │
│  - CozoDB graph storage                                             │
│  - 14 query endpoints                                               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       LOCAL CODEBASE                                │
│  Cloned GitHub repo or local directory                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│  Next.js App (Current) ─────────────────────────────────────────────│
│  - 3D Visualization (React Three Fiber)                             │
│  - Code Editor (Monaco)                                             │
│  - Chat Panel                                                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY                                 │
│  Cloudflare Workers / Next.js API Routes ───────────────────────────│
│  - Authentication                                                    │
│  - Rate Limiting                                                     │
│  - Request Routing                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌───────────────────────┐ ┌─────────────────┐ ┌─────────────────────┐
│   REPO ANALYZER       │ │   AI SERVICE    │ │   USER SERVICE      │
│   (Rust/WASM)         │ │   (Edge Worker) │ │   (Edge Worker)     │
│   - Parse code        │ │   - Claude API  │ │   - Auth (GitHub)   │
│   - Extract deps      │ │   - OpenAI API  │ │   - Preferences     │
│   - Calc complexity   │ │   - Rate limit  │ │   - API keys        │
│   - Git history       │ │   - Caching     │ │   - History         │
└───────────────────────┘ └─────────────────┘ └─────────────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │ Cloudflare KV   │  │ Cloudflare D1   │  │ Cloudflare R2       │ │
│  │ (Cache)         │  │ (SQLite)        │  │ (Object Storage)    │ │
│  │ - Repo metadata │  │ - Users         │  │ - Analyzed repos    │ │
│  │ - Analysis cache│  │ - API keys      │  │ - Large file cache  │ │
│  └─────────────────┘  │ - History       │  └─────────────────────┘ │
│                       └─────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Milestone 1: GitHub Repository Fetching

### Goal
Allow users to input a GitHub URL and fetch the repository structure.

### Tasks

#### 1.1 GitHub API Integration
```typescript
// src/lib/github/client.ts
interface GitHubFile {
  path: string;
  name: string;
  type: 'file' | 'dir';
  size: number;
  sha: string;
  url: string;
  download_url: string | null;
}

interface GitHubRepo {
  owner: string;
  name: string;
  default_branch: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
}

class GitHubClient {
  async getRepoInfo(owner: string, repo: string): Promise<GitHubRepo>;
  async getTree(owner: string, repo: string, branch?: string): Promise<GitHubFile[]>;
  async getFileContent(owner: string, repo: string, path: string): Promise<string>;
  async getCommitHistory(owner: string, repo: string, path?: string): Promise<Commit[]>;
}
```

#### 1.2 API Route for Repo Fetching
```typescript
// src/app/api/repo/[owner]/[name]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { owner: string; name: string } }
) {
  // 1. Validate GitHub URL
  // 2. Check cache (Cloudflare KV)
  // 3. Fetch from GitHub API
  // 4. Return repo structure
}
```

#### 1.3 Frontend Integration
- Add URL input field on landing page
- "Explore Repository" button
- Loading state while fetching
- Error handling for private repos / rate limits

### Deliverables
- [ ] GitHub API client library
- [ ] API route for repo fetching
- [ ] Frontend repo URL input
- [ ] Basic caching with KV

### Estimated Time: 4-6 hours

---

## Milestone 2: Parseltongue Integration

### Goal
Integrate Parseltongue as the code analysis backend, creating an adapter layer that transforms its output into Viz-Wizard's data format.

### Why Parseltongue?
- **Already built**: 12 language support with tree-sitter
- **Graph database**: CozoDB stores relationships efficiently
- **Rich API**: 14 endpoints for various queries
- **Same tech stack**: Rust, tree-sitter (what we planned)
- **Proven**: Designed for LLM context optimization

### Tasks

#### 2.1 Parseltongue Client Library
```typescript
// src/lib/parseltongue/client.ts

interface ParseltongueConfig {
  baseUrl: string;  // Default: http://localhost:7777
  timeout?: number;
}

interface CodeEntity {
  id: string;
  name: string;
  kind: 'function' | 'class' | 'module' | 'variable' | 'type';
  file_path: string;
  line_start: number;
  line_end: number;
  language: string;
}

interface Dependency {
  source_id: string;
  target_id: string;
  kind: 'calls' | 'imports' | 'extends' | 'implements' | 'uses';
}

interface CodebaseStats {
  total_files: number;
  total_entities: number;
  total_edges: number;
  languages: Record<string, number>;
}

interface HotspotInfo {
  entity_id: string;
  name: string;
  file_path: string;
  complexity_score: number;
  connection_count: number;
  risk_factors: string[];
}

class ParseltongueClient {
  constructor(config: ParseltongueConfig);

  // Health & Stats
  async healthCheck(): Promise<boolean>;
  async getStats(): Promise<CodebaseStats>;

  // Entity Queries
  async searchEntities(query: string): Promise<CodeEntity[]>;
  async getEntity(id: string): Promise<CodeEntity | null>;
  async getEntitiesInFile(filePath: string): Promise<CodeEntity[]>;

  // Relationship Queries
  async getCallers(entityId: string): Promise<CodeEntity[]>;
  async getCallees(entityId: string): Promise<CodeEntity[]>;
  async getBlastRadius(entityId: string, hops?: number): Promise<CodeEntity[]>;
  async getCircularDependencies(): Promise<Dependency[][]>;

  // Analysis
  async getHotspots(top?: number): Promise<HotspotInfo[]>;
  async getModuleGroups(): Promise<Record<string, CodeEntity[]>>;
}
```

#### 2.2 Data Transformer (Parseltongue → Viz-Wizard)
```typescript
// src/lib/parseltongue/transformer.ts

import { FileNode, Connection, RepositoryData, CityData } from '@/types/repository';

/**
 * Transform Parseltongue entities into Viz-Wizard FileNodes
 */
function entitiesToFileNodes(
  entities: CodeEntity[],
  hotspots: HotspotInfo[]
): FileNode[] {
  // Group entities by file
  const fileMap = new Map<string, CodeEntity[]>();
  for (const entity of entities) {
    const existing = fileMap.get(entity.file_path) || [];
    existing.push(entity);
    fileMap.set(entity.file_path, existing);
  }

  // Create FileNodes
  return Array.from(fileMap.entries()).map(([path, fileEntities]) => {
    const hotspot = hotspots.find(h => h.file_path === path);

    return {
      id: generateFileId(path),
      name: path.split('/').pop() || path,
      path,
      extension: path.split('.').pop() || '',
      lineCount: calculateLineCount(fileEntities),
      complexity: hotspot?.complexity_score || estimateComplexity(fileEntities),
      category: classifyFile(path, fileEntities),
      language: fileEntities[0]?.language || 'unknown',
      entities: fileEntities,
    };
  });
}

/**
 * Transform Parseltongue dependencies into Viz-Wizard Connections
 */
function dependenciesToConnections(
  dependencies: Dependency[],
  entityMap: Map<string, CodeEntity>
): Connection[] {
  return dependencies.map(dep => {
    const source = entityMap.get(dep.source_id);
    const target = entityMap.get(dep.target_id);

    return {
      id: `${dep.source_id}-${dep.target_id}`,
      sourceId: source?.file_path || dep.source_id,
      targetId: target?.file_path || dep.target_id,
      type: mapDependencyType(dep.kind),
      weight: 1,
      metadata: {
        sourceEntity: source?.name,
        targetEntity: target?.name,
        kind: dep.kind,
      },
    };
  });
}

/**
 * Map Parseltongue dependency kinds to Viz-Wizard connection types
 */
function mapDependencyType(kind: string): ConnectionType {
  const mapping: Record<string, ConnectionType> = {
    'calls': 'call',
    'imports': 'import',
    'extends': 'extends',
    'implements': 'implements',
    'uses': 'dataflow',
  };
  return mapping[kind] || 'import';
}

/**
 * Build complete RepositoryData from Parseltongue
 */
async function buildRepositoryData(
  client: ParseltongueClient,
  repoInfo: { owner: string; name: string }
): Promise<RepositoryData> {
  // Fetch all data from Parseltongue
  const [stats, hotspots, entities, circularDeps] = await Promise.all([
    client.getStats(),
    client.getHotspots(50),
    client.searchEntities('*'),  // Get all entities
    client.getCircularDependencies(),
  ]);

  // Build entity map for lookups
  const entityMap = new Map(entities.map(e => [e.id, e]));

  // Transform data
  const files = entitiesToFileNodes(entities, hotspots);
  const connections = await buildAllConnections(client, entities, entityMap);

  return {
    owner: repoInfo.owner,
    name: repoInfo.name,
    allFiles: files,
    connections,
    stats: {
      totalFiles: stats.total_files,
      totalLines: files.reduce((sum, f) => sum + f.lineCount, 0),
      totalDirectories: countDirectories(files),
      languages: stats.languages,
    },
    circularDependencies: circularDeps,
  };
}
```

#### 2.3 API Route for Analysis
```typescript
// src/app/api/analyze/route.ts

import { ParseltongueClient } from '@/lib/parseltongue/client';
import { buildRepositoryData } from '@/lib/parseltongue/transformer';

export async function POST(request: Request) {
  const { repoPath, parseltongueUrl } = await request.json();

  // Connect to Parseltongue server
  const client = new ParseltongueClient({
    baseUrl: parseltongueUrl || 'http://localhost:7777',
  });

  // Verify connection
  const healthy = await client.healthCheck();
  if (!healthy) {
    return Response.json(
      { error: 'Parseltongue server not available' },
      { status: 503 }
    );
  }

  // Build repository data
  const repoData = await buildRepositoryData(client, {
    owner: 'local',
    name: repoPath.split('/').pop(),
  });

  return Response.json(repoData);
}
```

#### 2.4 Real-time Queries for Features
```typescript
// src/lib/parseltongue/queries.ts

/**
 * Get blast radius for Critical Path Radar
 */
async function getBlastRadiusForFile(
  client: ParseltongueClient,
  filePath: string,
  hops: number = 3
): Promise<{
  affectedFiles: string[];
  affectedEntities: CodeEntity[];
  riskScore: number;
}> {
  const entities = await client.getEntitiesInFile(filePath);
  const allAffected = new Set<CodeEntity>();

  for (const entity of entities) {
    const affected = await client.getBlastRadius(entity.id, hops);
    affected.forEach(e => allAffected.add(e));
  }

  const affectedFiles = [...new Set([...allAffected].map(e => e.file_path))];

  return {
    affectedFiles,
    affectedEntities: [...allAffected],
    riskScore: calculateRiskScore(entities, allAffected.size),
  };
}

/**
 * Get usages for Find Usages feature
 */
async function getFileUsages(
  client: ParseltongueClient,
  filePath: string
): Promise<{
  usedBy: CodeEntity[];      // Files that use this file
  uses: CodeEntity[];         // Files this file uses
}> {
  const entities = await client.getEntitiesInFile(filePath);

  const usedBy = new Set<CodeEntity>();
  const uses = new Set<CodeEntity>();

  for (const entity of entities) {
    const callers = await client.getCallers(entity.id);
    const callees = await client.getCallees(entity.id);

    callers.forEach(e => usedBy.add(e));
    callees.forEach(e => uses.add(e));
  }

  return {
    usedBy: [...usedBy],
    uses: [...uses],
  };
}

/**
 * Enhanced Critical Path using Parseltongue hotspots
 */
async function getCriticalPathFiles(
  client: ParseltongueClient,
  topN: number = 10
): Promise<CriticalPathScore[]> {
  const hotspots = await client.getHotspots(topN);

  return hotspots.map(h => ({
    fileId: generateFileId(h.file_path),
    filePath: h.file_path,
    couplingScore: Math.min(100, h.connection_count * 5),
    complexityScore: h.complexity_score,
    velocityScore: 50,  // TODO: From git history
    coverageScore: 50,  // TODO: From test detection
    overallRisk: h.complexity_score * 0.4 + Math.min(100, h.connection_count * 5) * 0.4 + 50 * 0.2,
    factors: h.risk_factors,
  }));
}
```

#### 2.5 Parseltongue Server Management
```typescript
// src/lib/parseltongue/server.ts

import { spawn, ChildProcess } from 'child_process';

interface ServerOptions {
  dbPath: string;
  port?: number;
}

class ParseltongueServer {
  private process: ChildProcess | null = null;
  private dbPath: string;
  private port: number;

  constructor(options: ServerOptions) {
    this.dbPath = options.dbPath;
    this.port = options.port || 7777;
  }

  /**
   * Index a codebase (run once per repo)
   */
  async indexCodebase(repoPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn('parseltongue', [
        'pt01-folder-to-cozodb-streamer',
        repoPath,
        '--db', `rocksdb:${this.dbPath}`,
      ]);

      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Indexing failed with code ${code}`));
      });

      proc.stderr.on('data', (data) => {
        console.error(`Indexing error: ${data}`);
      });
    });
  }

  /**
   * Start the HTTP query server
   */
  async start(): Promise<void> {
    this.process = spawn('parseltongue', [
      'pt08-http-code-query-server',
      '--db', `rocksdb:${this.dbPath}`,
      '--port', this.port.toString(),
    ]);

    // Wait for server to be ready
    await this.waitForHealth();
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  private async waitForHealth(maxAttempts: number = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await fetch(`http://localhost:${this.port}/server-health-check-status`);
        if (res.ok) return;
      } catch {
        // Server not ready yet
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error('Server failed to start');
  }
}
```

### Deliverables
- [ ] Parseltongue TypeScript client library
- [ ] Data transformer (Parseltongue → Viz-Wizard format)
- [ ] API route for analysis
- [ ] Real-time query functions for features
- [ ] Server management utilities
- [ ] Integration tests

### Estimated Time: 8-10 hours (reduced from 15-20 hours by using Parseltongue)

---

## Milestone 3: Git History Analysis

### Goal
Analyze git commit history to calculate:
- File change velocity (how often files change)
- Ownership (who owns which files)
- Hotspots (frequently changed + high complexity)

### Tasks

#### 3.1 Git History Fetching
```typescript
// src/lib/github/history.ts
interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: Date;
  filesChanged: string[];
  additions: number;
  deletions: number;
}

async function getCommitHistory(
  owner: string,
  repo: string,
  options: {
    since?: Date;
    until?: Date;
    path?: string;
    maxCommits?: number;
  }
): Promise<CommitInfo[]>;
```

#### 3.2 Velocity Calculation
```typescript
// src/lib/analysis/velocity.ts
interface FileVelocity {
  path: string;
  changeCount: number;      // Total changes in period
  changeFrequency: number;  // Changes per week
  lastChanged: Date;
  contributors: string[];
  churnScore: number;       // Additions + Deletions
}

function calculateVelocity(
  commits: CommitInfo[],
  periodDays: number = 90
): Map<string, FileVelocity>;
```

#### 3.3 Code Ownership
```typescript
// src/lib/analysis/ownership.ts
interface FileOwnership {
  path: string;
  primaryOwner: string;     // Most commits
  contributors: {
    name: string;
    commits: number;
    linesChanged: number;
    lastContribution: Date;
  }[];
  ownershipScore: number;   // How concentrated is ownership?
}
```

#### 3.4 Hotspot Detection
```typescript
// src/lib/analysis/hotspots.ts
interface Hotspot {
  path: string;
  score: number;            // Composite risk score
  factors: {
    complexity: number;
    velocity: number;
    ownership: number;      // Low ownership = risk
    coverage: number;
  };
  recommendation: string;
}

function detectHotspots(
  files: FileAnalysis[],
  velocity: Map<string, FileVelocity>,
  ownership: Map<string, FileOwnership>
): Hotspot[];
```

### Deliverables
- [ ] Git history fetching from GitHub API
- [ ] Velocity calculation per file
- [ ] Code ownership analysis
- [ ] Hotspot detection algorithm
- [ ] Integration with Critical Path Radar

### Estimated Time: 8-10 hours

---

## Milestone 4: Secure AI Integration

### Goal
Move AI integration from client-side to secure backend:
- Store API keys securely (encrypted)
- Rate limiting per user
- Response caching
- Support multiple providers

### Tasks

#### 4.1 AI Service Worker
```typescript
// workers/ai-service/src/index.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 1. Authenticate user
    // 2. Get user's API key from D1 (encrypted)
    // 3. Check rate limit
    // 4. Forward to AI provider
    // 5. Cache response if appropriate
    // 6. Return response
  }
}
```

#### 4.2 API Key Management
```typescript
// src/lib/ai/keys.ts
interface EncryptedApiKey {
  provider: 'anthropic' | 'openai';
  encryptedKey: string;
  iv: string;
  createdAt: Date;
}

// Encrypt API keys before storing
async function encryptApiKey(key: string, userSecret: string): Promise<EncryptedApiKey>;
async function decryptApiKey(encrypted: EncryptedApiKey, userSecret: string): Promise<string>;
```

#### 4.3 Rate Limiting
```typescript
// workers/ai-service/src/ratelimit.ts
interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerDay: number;
  tokensPerDay: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  free: { requestsPerMinute: 5, requestsPerDay: 50, tokensPerDay: 10000 },
  pro: { requestsPerMinute: 20, requestsPerDay: 500, tokensPerDay: 100000 },
  byok: { requestsPerMinute: 60, requestsPerDay: -1, tokensPerDay: -1 }, // Unlimited with own key
};
```

#### 4.4 Response Caching
```typescript
// Cache common questions about code patterns
const CACHEABLE_PROMPTS = [
  'explain this code',
  'what does this do',
  'summarize',
];

async function getCachedResponse(
  fileHash: string,
  promptHash: string
): Promise<string | null>;
```

### Deliverables
- [ ] AI service Cloudflare Worker
- [ ] Encrypted API key storage
- [ ] Rate limiting with KV
- [ ] Response caching
- [ ] Multiple provider support (Claude, GPT-4)

### Estimated Time: 6-8 hours

---

## Milestone 5: User Authentication & Persistence

### Goal
Allow users to:
- Sign in with GitHub
- Save analyzed repositories
- Store preferences
- View analysis history

### Tasks

#### 5.1 GitHub OAuth
```typescript
// src/app/api/auth/github/route.ts
export async function GET(request: Request) {
  // Redirect to GitHub OAuth
}

// src/app/api/auth/github/callback/route.ts
export async function GET(request: Request) {
  // 1. Exchange code for token
  // 2. Get user info from GitHub
  // 3. Create/update user in D1
  // 4. Create session
  // 5. Redirect to app
}
```

#### 5.2 Database Schema
```sql
-- schema.sql (Cloudflare D1)

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  github_id INTEGER UNIQUE NOT NULL,
  username TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL, -- 'anthropic' | 'openai'
  encrypted_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analyzed_repos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  branch TEXT NOT NULL,
  commit_sha TEXT NOT NULL,
  analysis_data_url TEXT NOT NULL, -- R2 URL
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, owner, name, branch)
);

CREATE TABLE user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  theme TEXT DEFAULT 'dark',
  default_zoom_level TEXT DEFAULT 'regional',
  show_labels BOOLEAN DEFAULT true,
  show_connections BOOLEAN DEFAULT true,
  ai_model TEXT DEFAULT 'claude'
);
```

#### 5.3 Session Management
```typescript
// src/lib/auth/session.ts
interface Session {
  userId: string;
  githubToken: string;
  expiresAt: Date;
}

// Use signed cookies for session
async function createSession(userId: string, githubToken: string): Promise<string>;
async function getSession(sessionToken: string): Promise<Session | null>;
async function deleteSession(sessionToken: string): Promise<void>;
```

### Deliverables
- [ ] GitHub OAuth flow
- [ ] D1 database schema and migrations
- [ ] Session management
- [ ] User preferences API
- [ ] Analyzed repos history

### Estimated Time: 8-10 hours

---

## Milestone 6: Real-time Collaboration (Future)

### Goal
Allow multiple users to explore the same repository together:
- Shared cursor positions
- Shared annotations
- Chat between collaborators

### Tasks

#### 6.1 Cloudflare Durable Objects
```typescript
// workers/collaboration/src/room.ts
export class VisualizationRoom implements DurableObject {
  users: Map<string, WebSocket> = new Map();

  async handleWebSocket(ws: WebSocket, userId: string) {
    // Track user connection
    // Broadcast user joins/leaves
    // Sync cursor positions
    // Handle annotations
  }
}
```

#### 6.2 Presence System
```typescript
interface UserPresence {
  userId: string;
  username: string;
  avatar: string;
  cursor: {
    buildingId: string | null;
    cameraPosition: [number, number, number];
  };
  color: string; // Unique color per user
}
```

### Deliverables (Future)
- [ ] Durable Objects for room state
- [ ] WebSocket connection handling
- [ ] Presence UI (avatars, cursors)
- [ ] Shared annotations

### Estimated Time: 15-20 hours (Future milestone)

---

## Technology Stack Summary

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | Next.js 14 | Already using, great DX |
| 3D Rendering | React Three Fiber | Already using |
| API Gateway | Next.js API Routes / CF Workers | Serverless, edge-ready |
| Code Analysis | Rust + WASM | Performance, accuracy |
| Database | Cloudflare D1 (SQLite) | Serverless, edge-native |
| Cache | Cloudflare KV | Fast key-value storage |
| Object Storage | Cloudflare R2 | S3-compatible, cheap |
| Auth | GitHub OAuth | Users already have GitHub |
| AI | Anthropic Claude / OpenAI | Best-in-class |
| Real-time | Cloudflare Durable Objects | WebSocket at edge |

---

## Implementation Timeline

| Milestone | Duration | Dependencies |
|-----------|----------|--------------|
| 1. GitHub Fetching | 4-6 hours | None |
| 2. Parseltongue Integration | 8-10 hours | M1 |
| 3. Git History | 8-10 hours | M1 |
| 4. AI Integration | 6-8 hours | None |
| 5. Auth & Persistence | 8-10 hours | M1, M4 |
| 6. Collaboration | 15-20 hours | M5 (Future) |

**Total MVP (M1-M5):** 35-45 hours *(saved 5-10 hours using Parseltongue)*
**Full Feature Set (M1-M6):** 50-65 hours

### Parseltongue Integration Benefits

| Aspect | Build from Scratch | With Parseltongue |
|--------|-------------------|-------------------|
| Time | 15-20 hours | 8-10 hours |
| Languages | 3-5 initially | 12 supported |
| Graph DB | Need to build | CozoDB included |
| API | Need to design | 14 endpoints ready |
| Maintenance | Full ownership | Shared with project |

---

## Getting Started

### Prerequisites
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Parseltongue
cargo install --git https://github.com/that-in-rust/parseltongue-dependency-graph-generator

# Verify installation
parseltongue --help

# Install Cloudflare Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

### Quick Start: Analyze a Repository
```bash
# 1. Clone a repo to analyze
git clone https://github.com/facebook/react.git /tmp/react

# 2. Index the codebase (one-time, creates graph database)
parseltongue pt01-folder-to-cozodb-streamer /tmp/react --db "rocksdb:./data/react.db"

# 3. Start the query server
parseltongue pt08-http-code-query-server --db "rocksdb:./data/react.db" --port 7777

# 4. Test the API
curl http://localhost:7777/codebase-statistics-overview-summary
curl "http://localhost:7777/complexity-hotspots-ranking-view?top=10"

# 5. Start Viz-Wizard frontend (connects to localhost:7777)
cd viz-wizard && npm run dev
```

### Project Structure
```
viz-wizard/
├── src/                    # Next.js frontend (existing)
├── analyzer/               # Rust WASM analyzer
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs
│       ├── parsers/
│       ├── metrics/
│       └── classify.rs
├── workers/                # Cloudflare Workers
│   ├── ai-service/
│   └── collaboration/
├── migrations/             # D1 database migrations
└── wrangler.toml          # Cloudflare configuration
```

### Development Commands
```bash
# Start frontend
npm run dev

# Start Parseltongue (index + server)
parseltongue pt01-folder-to-cozodb-streamer ./my-repo --db "rocksdb:./data/myrepo.db"
parseltongue pt08-http-code-query-server --db "rocksdb:./data/myrepo.db" --port 7777

# Deploy workers
wrangler deploy

# Run D1 migrations
wrangler d1 execute viz-wizard-db --file=migrations/001_init.sql
```

---

## Deployment Architecture Options

### Option A: Local-First (Desktop App)
Best for: Privacy-conscious users, large repos, offline use

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S MACHINE                            │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │  Viz-Wizard     │    │  Parseltongue Server            │ │
│  │  (Electron/     │───▶│  (Rust binary)                  │ │
│  │   Tauri App)    │    │  - Indexes local repos          │ │
│  │                 │    │  - Serves HTTP API              │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
│           │                          │                       │
│           ▼                          ▼                       │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │  Local Storage  │    │  CozoDB (RocksDB)               │ │
│  │  - Preferences  │    │  - Indexed code graph           │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Pros:** Fast, private, works offline
**Cons:** Requires installation, no collaboration

### Option B: Cloud-Hosted (SaaS)
Best for: Quick exploration, public repos, sharing

```
┌─────────────────┐     ┌─────────────────────────────────────┐
│  User Browser   │     │          CLOUDFLARE                  │
│  ┌───────────┐  │     │  ┌─────────────────────────────────┐│
│  │ Viz-Wizard│──┼────▶│  │  Workers (API Gateway)          ││
│  │ Frontend  │  │     │  │  - Auth, rate limiting          ││
│  └───────────┘  │     │  └───────────────┬─────────────────┘│
└─────────────────┘     │                  │                   │
                        │                  ▼                   │
                        │  ┌─────────────────────────────────┐│
                        │  │  Analysis Worker Pool           ││
                        │  │  - Parseltongue (WASM)          ││
                        │  │  - Or: Dedicated VM instances   ││
                        │  └───────────────┬─────────────────┘│
                        │                  │                   │
                        │  ┌───────┬───────┴───────┬────────┐ │
                        │  │  D1   │      KV       │   R2   │ │
                        │  │(Users)│   (Cache)     │(Repos) │ │
                        │  └───────┴───────────────┴────────┘ │
                        └─────────────────────────────────────┘
```

**Pros:** No install, shareable links, collaboration
**Cons:** Needs infrastructure, costs at scale

### Option C: Hybrid (Recommended)
Best for: Flexibility, gradual scaling

```
PUBLIC REPOS (Cloud)              PRIVATE REPOS (Local)
        │                                   │
        ▼                                   ▼
┌───────────────────┐            ┌───────────────────────┐
│ viz-wizard.dev    │            │ Local Parseltongue    │
│ - GitHub OAuth    │            │ - User runs on machine│
│ - Clone + Analyze │            │ - Connects to cloud UI│
│ - Cached results  │            │ - Data stays local    │
└───────────────────┘            └───────────────────────┘
        │                                   │
        └───────────┬───────────────────────┘
                    ▼
          ┌─────────────────────┐
          │  Same Viz-Wizard UI │
          │  (Cloud or Local)   │
          └─────────────────────┘
```

**Implementation:**
```typescript
// Frontend detects where Parseltongue is running
const PARSELTONGUE_URL = process.env.NEXT_PUBLIC_PARSELTONGUE_URL
  || 'http://localhost:7777';  // Default to local

// User can connect to local instance
async function connectToLocalInstance(port: number) {
  const url = `http://localhost:${port}`;
  const healthy = await fetch(`${url}/server-health-check-status`);
  if (healthy.ok) {
    localStorage.setItem('parseltongue_url', url);
    return true;
  }
  return false;
}
```

---

## Success Metrics

1. **Performance**
   - Analyze 1,000 file repo in < 5 seconds
   - Initial load time < 2 seconds
   - AI response time < 3 seconds

2. **Accuracy**
   - Import detection accuracy > 95%
   - Complexity scores correlate with bug density
   - File category classification > 90% accurate

3. **User Experience**
   - Any public GitHub repo works
   - No manual configuration needed
   - Mobile-responsive visualization

---

## End-to-End User Flow (with Parseltongue)

```
┌────────────────────────────────────────────────────────────────────┐
│ 1. USER ENTERS GITHUB URL                                          │
│    viz-wizard.dev?repo=facebook/react                              │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│ 2. BACKEND CHECKS CACHE                                            │
│    - Is this repo already analyzed?                                │
│    - Is the analysis fresh (< 24h)?                                │
│    If YES → Skip to step 5                                         │
└────────────────────────────────────────────────────────────────────┘
                                    │ NO
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│ 3. CLONE & INDEX                                                   │
│    - Shallow clone from GitHub                                     │
│    - Run: parseltongue pt01-folder-to-cozodb-streamer              │
│    - Progress: "Analyzing 2,847 files..."                          │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│ 4. START QUERY SERVER                                              │
│    - Run: parseltongue pt08-http-code-query-server                 │
│    - Health check: /server-health-check-status                     │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│ 5. FETCH & TRANSFORM DATA                                          │
│    - GET /codebase-statistics-overview-summary                     │
│    - GET /complexity-hotspots-ranking-view?top=50                  │
│    - GET /code-entities-search-fuzzy?q=*                           │
│    - Transform to Viz-Wizard format                                │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│ 6. RENDER 3D CITY                                                  │
│    - Generate city layout from file structure                      │
│    - Buildings sized by complexity                                 │
│    - Connections from dependency graph                             │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│ 7. INTERACTIVE EXPLORATION                                         │
│    - Click building → /code-entities-search-fuzzy?q=filename       │
│    - Find Usages → /reverse-callers-query-graph                    │
│    - Critical Path → /complexity-hotspots-ranking-view             │
│    - Blast Radius → /blast-radius-impact-analysis                  │
└────────────────────────────────────────────────────────────────────┘
```

---

## Feature Mapping: Viz-Wizard ↔ Parseltongue

| Viz-Wizard Feature | Parseltongue Endpoint | Notes |
|-------------------|----------------------|-------|
| Repository Stats | `/codebase-statistics-overview-summary` | Total files, entities, languages |
| Building Search | `/code-entities-search-fuzzy?q=X` | Fuzzy search by name |
| Find Usages | `/reverse-callers-query-graph?entity=X` | Who calls this? |
| Critical Path Radar | `/complexity-hotspots-ranking-view?top=N` | High-risk files |
| Blast Radius | `/blast-radius-impact-analysis?entity=X&hops=N` | Impact analysis |
| Circular Dependencies | `/circular-dependency-detection-scan` | Detect cycles |
| Connection Types | Entity relationships in graph | calls, imports, extends |
| File Content | GitHub API (not Parseltongue) | Fetch from source |

---

## Next Steps

1. **Start with Milestone 1** - GitHub repo fetching
2. **Milestone 2** - Parseltongue client library + data transformer
3. **Local development first** - Get end-to-end flow working locally
4. **Then add cloud infrastructure** - Deploy to Cloudflare
5. **User feedback loop** - Deploy early, iterate often
