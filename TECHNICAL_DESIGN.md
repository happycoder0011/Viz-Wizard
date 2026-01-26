# Technical Design Document
## Viz-Wizard: Codebase Visualization Platform

**Version:** 1.0
**Last Updated:** January 2025
**Status:** Draft
**Authors:** Engineering Team

---

## Table of Contents
1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Hierarchical Clustering Engine](#3-hierarchical-clustering-engine)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Data Models](#6-data-models)
7. [API Specifications](#7-api-specifications)
8. [Frontend Milestones](#8-frontend-milestones)
9. [Backend Milestones](#9-backend-milestones)
10. [Testing Strategy](#10-testing-strategy)
11. [DevOps & Infrastructure](#11-devops--infrastructure)
12. [Security Considerations](#12-security-considerations)
13. [Performance Optimization](#13-performance-optimization)

---

## 1. Overview

### 1.1 Purpose
This document outlines the technical architecture, implementation details, and development milestones for Viz-Wizard—a codebase visualization platform that renders repositories as interactive 3D environments.

### 1.2 Scope
- Frontend application (Next.js + React Three Fiber)
- Backend services (API, parsing, caching)
- Data pipeline (Git operations, AST parsing)
- Infrastructure and deployment

### 1.3 Design Principles

| Principle | Description |
|-----------|-------------|
| Performance First | 60 FPS rendering, <3s TTI |
| Progressive Loading | Show skeleton → structure → details |
| Stateless Backend | Horizontal scaling via serverless |
| Cache Aggressively | Minimize redundant parsing |
| Fail Gracefully | Partial data > no data |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Next.js   │  │  R3F/Three  │  │    D3.js    │  │   Zustand   │    │
│  │   Router    │  │   WebGL     │  │   Graphs    │  │   State     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              EDGE LAYER                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────┐  │
│  │   Vercel Edge       │  │   WebSocket         │  │   CDN          │  │
│  │   Functions         │  │   Gateway           │  │   (Assets)     │  │
│  └─────────────────────┘  └─────────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SERVICES LAYER                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  Repository  │  │   Parser     │  │   Analytics  │  │   Auth     │  │
│  │  Service     │  │   Workers    │  │   Service    │  │   Service  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   Redis      │  │   PostgreSQL │  │   S3/R2      │  │   GitHub   │  │
│  │   (Cache)    │  │   (Persist)  │  │   (Blobs)    │  │   API      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │───▶│  Check   │───▶│  Clone   │───▶│  Parse   │───▶│  Stream  │
│  Request │    │  Cache   │    │  Repo    │    │  AST     │    │  to UI   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                     │                                               ▲
                     │ Cache Hit                                     │
                     └───────────────────────────────────────────────┘
```

### 2.3 Component Responsibilities

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| Web Client | Rendering, interaction, state | Next.js, R3F, Zustand |
| Edge API | Request routing, auth, rate limiting | Vercel Edge |
| Repo Service | Git operations, metadata extraction | Node.js workers |
| Parser Workers | AST generation, dependency analysis | Tree-sitter, Rust/WASM |
| Cache Layer | Parsed data, session state | Redis/Upstash |
| Database | User data, saved views, analytics | PostgreSQL/Supabase |

---

## 3. Hierarchical Clustering Engine

The Clustering Engine is a core backend service that transforms flat file structures into multi-level hierarchical abstractions. This enables the zoom-level navigation that makes large codebases comprehensible.

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CLUSTERING PIPELINE                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│   STRUCTURAL  │          │   SEMANTIC    │          │   TEMPORAL    │
│   CLUSTERER   │          │   CLUSTERER   │          │   CLUSTERER   │
│  (Directory)  │          │ (Dependency)  │          │  (Co-change)  │
└───────────────┘          └───────────────┘          └───────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    ▼
                    ┌───────────────────────────┐
                    │     CLUSTER AGGREGATOR    │
                    │   (Merge & Rank Results)  │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │    HIERARCHY BUILDER      │
                    │  (Multi-level Tree)       │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │     CLUSTER CACHE         │
                    │   (Redis, per strategy)   │
                    └───────────────────────────┘
```

### 3.2 Clustering Algorithms

#### 3.2.1 Structural Clustering (Directory-Based)

**Implementation:** Recursive directory tree traversal with depth limiting.

```typescript
interface StructuralClusterer {
  // Build cluster hierarchy from directory structure
  cluster(fileTree: FileTree, options: StructuralOptions): ClusterHierarchy;
}

interface StructuralOptions {
  maxDepth: number;           // Max levels in hierarchy (default: 4)
  minFilesPerCluster: number; // Collapse small directories (default: 3)
  ignorePatterns: string[];   // Patterns to exclude (node_modules, etc.)
}

// Algorithm:
// 1. Start at root directory
// 2. For each directory with >= minFiles, create a cluster
// 3. Recursively process subdirectories up to maxDepth
// 4. Collapse leaf directories with < minFiles into parent
```

**Complexity:** O(n) where n = number of files

---

#### 3.2.2 Semantic Clustering (Dependency-Based)

**Implementation:** Graph community detection using Louvain algorithm.

```typescript
interface SemanticClusterer {
  // Build clusters from import/dependency graph
  cluster(dependencyGraph: DependencyGraph, options: SemanticOptions): ClusterHierarchy;
}

interface SemanticOptions {
  resolution: number;         // Louvain resolution parameter (0.5 - 2.0)
  minClusterSize: number;     // Minimum files per cluster
  maxHierarchyLevels: number; // Recursive community detection levels
}
```

**Algorithm: Louvain Community Detection**

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: MODULARITY OPTIMIZATION                                │
│  ─────────────────────────────────────────────────────────────── │
│  1. Start with each node in its own community                    │
│  2. For each node, try moving to neighbor's community            │
│  3. Accept move if it increases modularity                       │
│  4. Repeat until no improvement possible                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: COMMUNITY AGGREGATION                                  │
│  ─────────────────────────────────────────────────────────────── │
│  1. Merge nodes in same community into super-node                │
│  2. Build new graph with super-nodes                             │
│  3. Repeat Phase 1 on new graph                                  │
│  4. Continue until hierarchy is built                            │
└─────────────────────────────────────────────────────────────────┘
```

**Modularity Formula:**

```
Q = (1/2m) Σᵢⱼ [Aᵢⱼ - (kᵢkⱼ/2m)] δ(cᵢ, cⱼ)

Where:
- Aᵢⱼ = edge weight between nodes i and j (import count)
- kᵢ = degree of node i
- m = total edge weight
- cᵢ = community of node i
- δ = 1 if same community, 0 otherwise
```

**Implementation in Rust:**

```rust
// clustering-engine/src/semantic.rs

pub struct LouvainClusterer {
    resolution: f64,
    min_cluster_size: usize,
}

impl LouvainClusterer {
    pub fn cluster(&self, graph: &DependencyGraph) -> Vec<Community> {
        let mut communities = self.initialize_communities(graph);
        let mut improved = true;

        while improved {
            improved = false;
            for node in graph.nodes() {
                let best_community = self.find_best_community(node, &communities, graph);
                if best_community != communities[node] {
                    communities[node] = best_community;
                    improved = true;
                }
            }
        }

        self.aggregate_communities(communities)
    }

    fn modularity_gain(&self, node: NodeId, community: CommunityId,
                       graph: &DependencyGraph) -> f64 {
        // Calculate change in modularity if node moves to community
        let k_i = graph.degree(node);
        let k_i_in = graph.edges_to_community(node, community);
        let sigma_tot = self.community_total_degree(community);
        let m = graph.total_weight();

        (k_i_in as f64 / m) - self.resolution * (sigma_tot * k_i) as f64 / (2.0 * m * m)
    }
}
```

**Complexity:** O(n log n) average case

---

#### 3.2.3 Temporal Clustering (Co-Change Analysis)

**Implementation:** Association rule mining on commit history.

```typescript
interface TemporalClusterer {
  // Build clusters from files that change together
  cluster(commits: Commit[], options: TemporalOptions): ClusterHierarchy;
}

interface TemporalOptions {
  minSupport: number;         // Minimum co-occurrence frequency (0.1 = 10%)
  minConfidence: number;      // Minimum association confidence (0.5 = 50%)
  timeWindow: number;         // Days to consider (default: 365)
}
```

**Algorithm: Apriori-based Co-Change Detection**

```
1. Build transaction database: Each commit = transaction, files = items
2. Find frequent itemsets (files that appear together often)
3. Generate association rules: FileA → FileB (confidence, support)
4. Build clusters from strongly associated file groups
5. Use hierarchical agglomerative clustering on association matrix
```

**Co-Change Matrix Calculation:**

```typescript
function buildCoChangeMatrix(commits: Commit[]): Matrix {
  const matrix = new SparseMatrix(fileCount, fileCount);

  for (const commit of commits) {
    const files = commit.changedFiles;
    // For each pair of files in the commit, increment co-change count
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        matrix.increment(files[i], files[j]);
      }
    }
  }

  // Normalize by total changes
  return matrix.normalize();
}
```

**Complexity:** O(c × f²) where c = commits, f = avg files per commit

---

#### 3.2.4 Ownership Clustering (Author-Based)

**Implementation:** K-means clustering on author contribution vectors.

```typescript
interface OwnershipClusterer {
  cluster(blameData: BlameData[], options: OwnershipOptions): ClusterHierarchy;
}

interface OwnershipOptions {
  primaryAuthorThreshold: number; // % to be considered primary (default: 0.5)
  minContributors: number;        // Min contributors for "shared" cluster
}
```

**Algorithm:**

```
1. For each file, compute author contribution vector
   [author1: 0.6, author2: 0.3, author3: 0.1]
2. Cluster files by dominant author
3. Sub-cluster by secondary authors
4. Identify "shared" zones with no dominant author
```

---

#### 3.2.5 Functional Clustering (AI-Powered)

**Implementation:** LLM-based classification with embedding similarity.

```typescript
interface FunctionalClusterer {
  cluster(files: FileNode[], options: FunctionalOptions): ClusterHierarchy;
}

interface FunctionalOptions {
  categories: string[];       // Predefined categories or auto-detect
  embeddingModel: string;     // Model for code embeddings
  similarityThreshold: number; // Cosine similarity threshold
}
```

**Algorithm:**

```
1. Generate code embeddings for each file (using CodeBERT or similar)
2. If categories provided:
   a. Generate category embeddings
   b. Assign files to nearest category
3. If auto-detect:
   a. Use HDBSCAN clustering on embeddings
   b. Generate category names using LLM
4. Build hierarchy from category assignments
```

**Embedding Pipeline:**

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   File   │───▶│  Chunk   │───▶│  Embed   │───▶│  Cluster │
│  Content │    │  (4096)  │    │ (768-dim)│    │ (HDBSCAN)│
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

---

### 3.3 Hierarchy Builder

The Hierarchy Builder merges clustering results into a unified multi-level tree.

```typescript
interface ClusterHierarchy {
  root: ClusterNode;
  levels: number;             // Total depth of hierarchy
  strategy: ClusteringStrategy;
}

interface ClusterNode {
  id: string;
  name: string;               // Human-readable name
  level: number;              // 0 = root, increasing = deeper

  // Metrics (aggregated from children)
  metrics: ClusterMetrics;

  // Children
  children: ClusterNode[];    // Sub-clusters
  files: string[];            // File IDs (only at leaf level)

  // Relationships
  externalDependencies: ClusterEdge[]; // Connections to other clusters
}

interface ClusterMetrics {
  fileCount: number;
  totalLoc: number;
  avgComplexity: number;
  cohesion: number;           // Internal coupling (0-1)
  coupling: number;           // External coupling (0-1)
  churn: number;              // Changes per month
  busFactory: number;         // Minimum contributors
  healthScore: number;        // Composite score (0-100)
}

interface ClusterEdge {
  targetClusterId: string;
  weight: number;             // Number of cross-cluster imports
  type: 'import' | 'extends' | 'implements';
}
```

**Hierarchy Construction Algorithm:**

```typescript
function buildHierarchy(
  files: FileNode[],
  dependencyGraph: DependencyGraph,
  strategy: ClusteringStrategy,
  options: HierarchyOptions
): ClusterHierarchy {

  // Step 1: Run selected clustering algorithm
  const clusterer = getClusterer(strategy);
  const flatClusters = clusterer.cluster(files, dependencyGraph, options);

  // Step 2: Build tree structure
  const root = createRootCluster(files);

  for (const cluster of flatClusters) {
    // Determine level based on cluster size and depth
    const level = calculateLevel(cluster, options.maxLevels);

    // Find parent cluster
    const parent = findParent(root, cluster, level);

    // Attach to parent
    parent.children.push(cluster);
  }

  // Step 3: Calculate metrics bottom-up
  calculateMetricsRecursive(root);

  // Step 4: Calculate cross-cluster dependencies
  calculateExternalDependencies(root, dependencyGraph);

  return { root, levels: options.maxLevels, strategy };
}
```

---

### 3.4 Level-of-Detail (LOD) Data Structure

For rendering, we need different data representations at each zoom level.

```typescript
interface LODData {
  level0: Level0Data;  // Satellite view (mega-clusters)
  level1: Level1Data;  // Regional view (modules)
  level2: Level2Data;  // District view (files)
  level3: Level3Data;  // Street view (functions)
}

// Level 0: 3-10 mega-clusters
interface Level0Data {
  clusters: MegaCluster[];
  connections: ClusterConnection[];
}

interface MegaCluster {
  id: string;
  name: string;
  position: Vector3;          // Pre-computed layout position
  size: number;               // Volume for rendering
  color: Color;
  metrics: ClusterMetrics;
  childCount: number;         // Number of level-1 children
}

// Level 1: 10-50 modules per mega-cluster
interface Level1Data {
  parentId: string;           // Which level-0 cluster
  clusters: ModuleCluster[];
  connections: ClusterConnection[];
}

// Level 2: Individual files
interface Level2Data {
  parentId: string;           // Which level-1 module
  buildings: BuildingData[];
  roads: RoadData[];
}

// Level 3: Functions/classes within a file
interface Level3Data {
  fileId: string;
  nodes: FunctionNode[];
  edges: FlowEdge[];
}
```

---

### 3.5 Caching Strategy

Clustering results are cached at multiple levels for performance.

```
Cache Keys:

cluster:{owner}/{repo}:{strategy}:level0      → Level 0 data (5 min TTL)
cluster:{owner}/{repo}:{strategy}:level1:{id} → Level 1 for specific parent
cluster:{owner}/{repo}:{strategy}:level2:{id} → Level 2 for specific module
cluster:{owner}/{repo}:{strategy}:level3:{id} → Level 3 for specific file

cluster:{owner}/{repo}:matrix:dependency      → Full dependency matrix
cluster:{owner}/{repo}:matrix:cochange        → Co-change matrix
cluster:{owner}/{repo}:matrix:ownership       → Ownership matrix
```

**Cache Invalidation:**

```typescript
// Invalidate on new commits to the repository
async function invalidateOnPush(owner: string, repo: string, commitSha: string) {
  // Check which files changed
  const changedFiles = await getCommitFiles(owner, repo, commitSha);

  // Invalidate affected clusters
  const affectedClusters = findAffectedClusters(changedFiles);
  for (const clusterId of affectedClusters) {
    await cache.delete(`cluster:${owner}/${repo}:*:*:${clusterId}`);
  }

  // Invalidate matrices if significant changes
  if (changedFiles.length > 10) {
    await cache.delete(`cluster:${owner}/${repo}:matrix:*`);
  }
}
```

---

### 3.6 API Endpoints for Clustering

```
GET /api/repo/{owner}/{name}/clusters
  ?strategy=structural|semantic|temporal|ownership|functional
  &level=0|1|2|3
  &parentId={clusterId}  (required for level > 0)

Response:
{
  "strategy": "semantic",
  "level": 1,
  "parent": { "id": "mega-frontend", "name": "Frontend" },
  "clusters": [
    {
      "id": "module-auth",
      "name": "Authentication",
      "metrics": { ... },
      "position": [x, y, z],
      "size": 1234,
      "childCount": 47
    },
    ...
  ],
  "connections": [
    { "from": "module-auth", "to": "module-api", "weight": 23 }
  ]
}
```

---

### 3.7 Cluster Naming

Clusters need human-readable names. We use multiple strategies:

| Level | Primary Naming | Fallback |
|-------|----------------|----------|
| 0 | Directory name or LLM-generated | "Cluster 1" |
| 1 | Package.json name / directory name | "Module A" |
| 2 | File name | N/A |
| 3 | Function/class name | N/A |

**LLM Naming Prompt:**

```
Given these files in a cluster:
- src/auth/login.ts (handles user login)
- src/auth/session.ts (manages sessions)
- src/auth/jwt.ts (JWT token handling)
- src/middleware/auth-check.ts (authentication middleware)

Provide a concise 1-3 word name for this cluster that describes its purpose.
```

---

### 3.8 Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Structural clustering (10k files) | < 100ms | Simple tree traversal |
| Semantic clustering (10k files) | < 2s | Louvain is fast |
| Temporal clustering (10k files, 1yr history) | < 5s | Matrix computation |
| Ownership clustering (10k files) | < 1s | Blame data cached |
| Functional clustering (10k files) | < 30s | LLM inference |
| Level 0 render data | < 50ms | Pre-computed |
| Level 1 render data | < 100ms | Per parent |
| Level 2 render data | < 200ms | Per module |

---

## 4. Frontend Architecture

### 3.1 Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page
│   ├── [owner]/[repo]/
│   │   ├── page.tsx              # Main visualization
│   │   └── pr/[number]/page.tsx  # PR diff view
│   ├── api/                      # API routes
│   └── layout.tsx                # Root layout
│
├── components/
│   ├── canvas/                   # 3D components (R3F)
│   │   ├── CityView/
│   │   │   ├── Building.tsx
│   │   │   ├── District.tsx
│   │   │   ├── Road.tsx
│   │   │   └── CityScene.tsx
│   │   ├── HeatmapView/
│   │   │   ├── Terrain.tsx
│   │   │   ├── Peak.tsx
│   │   │   └── HeatmapScene.tsx
│   │   ├── ConstellationView/
│   │   │   ├── ContributorNode.tsx
│   │   │   ├── FileLink.tsx
│   │   │   └── ConstellationScene.tsx
│   │   ├── XRayView/
│   │   │   ├── FunctionNode.tsx
│   │   │   ├── FlowEdge.tsx
│   │   │   └── XRayScene.tsx
│   │   ├── shared/
│   │   │   ├── Camera.tsx
│   │   │   ├── Lighting.tsx
│   │   │   └── PostProcessing.tsx
│   │   └── SceneManager.tsx
│   │
│   ├── ui/                       # 2D UI components
│   │   ├── CommandPalette/
│   │   ├── ContextCard/
│   │   ├── TimelineScrubber/
│   │   ├── ViewSwitcher/
│   │   ├── LoadingStates/
│   │   └── common/
│   │
│   └── providers/                # Context providers
│       ├── VisualizationProvider.tsx
│       └── ThemeProvider.tsx
│
├── hooks/
│   ├── useRepository.ts          # Repo data fetching
│   ├── useVisualization.ts       # View state management
│   ├── useCamera.ts              # Camera controls
│   ├── useSearch.ts              # Command palette
│   └── useTimeline.ts            # Temporal scrubbing
│
├── stores/
│   ├── repositoryStore.ts        # Repo data
│   ├── visualizationStore.ts     # View settings
│   ├── clusterStore.ts           # Cluster hierarchy & navigation
│   ├── selectionStore.ts         # Selected nodes
│   └── filterStore.ts            # Active filters
│
├── lib/
│   ├── api/                      # API client
│   ├── parsers/                  # Client-side parsing utils
│   ├── geometry/                 # 3D geometry generators
│   │   ├── buildingGenerator.ts
│   │   ├── terrainGenerator.ts
│   │   └── layoutAlgorithms.ts
│   ├── colors/                   # Color schemes
│   └── utils/                    # Helpers
│
├── types/
│   ├── repository.ts
│   ├── visualization.ts
│   └── api.ts
│
└── styles/
    └── globals.css
```

### 3.2 State Management

```typescript
// stores/repositoryStore.ts
interface RepositoryState {
  // Repository metadata
  owner: string;
  name: string;
  defaultBranch: string;

  // Parsed data
  files: Map<string, FileNode>;
  directories: Map<string, DirectoryNode>;
  dependencies: DependencyGraph;
  contributors: Contributor[];
  commits: CommitHistory;

  // Loading states
  status: 'idle' | 'loading' | 'parsing' | 'ready' | 'error';
  progress: number;
  error: Error | null;

  // Actions
  loadRepository: (owner: string, repo: string) => Promise<void>;
  loadPRDiff: (prNumber: number) => Promise<void>;
}

// stores/visualizationStore.ts
interface VisualizationState {
  // Current view
  activeView: 'city' | 'heatmap' | 'constellation' | 'xray';

  // View-specific settings
  citySettings: CityViewSettings;
  heatmapSettings: HeatmapViewSettings;
  constellationSettings: ConstellationViewSettings;
  xraySettings: XRayViewSettings;

  // Camera
  cameraPosition: Vector3;
  cameraTarget: Vector3;
  zoomLevel: number;

  // Filters
  activeFilters: Filter[];
  highlightedNodes: Set<string>;
  selectedNode: string | null;

  // Timeline (for heatmap)
  timeRange: [Date, Date];
  currentTime: Date;

  // Actions
  setView: (view: ViewType) => void;
  setFilter: (filter: Filter) => void;
  selectNode: (nodeId: string) => void;
  setTimelinePosition: (time: Date) => void;
}

// stores/clusterStore.ts
interface ClusterState {
  // Current clustering configuration
  strategy: ClusteringStrategy;
  hierarchy: ClusterHierarchy | null;

  // Navigation state
  currentLevel: number;              // 0-3 zoom level
  currentClusterId: string | null;   // Which cluster we're viewing
  breadcrumbs: BreadcrumbItem[];     // Navigation trail

  // Level-specific data (loaded on demand)
  levelData: Map<string, LODRenderData>; // key = parentId or 'root'

  // Loading states
  loadingLevel: number | null;
  error: Error | null;

  // Actions
  setStrategy: (strategy: ClusteringStrategy) => Promise<void>;
  zoomIn: (clusterId: string) => Promise<void>;
  zoomOut: () => Promise<void>;
  zoomToLevel: (level: number, clusterId?: string) => Promise<void>;
  resetZoom: () => void;
  loadLevelData: (level: number, parentId: string | null) => Promise<void>;
}

interface BreadcrumbItem {
  level: number;
  clusterId: string;
  name: string;
}
```

### 3.3 3D Rendering Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Three Fiber                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Scene     │───▶│  Renderer   │───▶│   Canvas    │         │
│  │   Graph     │    │  (WebGL2)   │    │   Output    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────┐        │
│  │                  Scene Components                     │        │
│  ├─────────────────────────────────────────────────────┤        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │        │
│  │  │ Instanced│  │  Custom  │  │  Post    │          │        │
│  │  │ Meshes   │  │ Shaders  │  │ Process  │          │        │
│  │  └──────────┘  └──────────┘  └──────────┘          │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Performance Techniques:**

| Technique | Purpose | Implementation |
|-----------|---------|----------------|
| Instanced Meshes | Render 10k+ buildings | `<instancedMesh>` with matrix updates |
| Level of Detail | Reduce distant geometry | Distance-based mesh swapping |
| Frustum Culling | Skip off-screen objects | Built-in Three.js |
| Occlusion Culling | Skip hidden objects | Custom GPU-based |
| Texture Atlases | Reduce draw calls | Combined material textures |
| Web Workers | Off-thread geometry | Geometry generation in worker |

### 3.4 View-Specific Components

#### City View Architecture

```typescript
// components/canvas/CityView/CityScene.tsx
interface CitySceneProps {
  files: FileNode[];
  directories: DirectoryNode[];
  dependencies: DependencyGraph;
  highlightedFiles?: Set<string>;
}

// Building dimensions derived from file metrics
interface BuildingDimensions {
  width: number;    // Based on complexity
  depth: number;    // Based on import count
  height: number;   // Based on LoC
}

// Layout algorithm: Treemap for district placement
// Buildings placed within districts using grid packing
```

#### Heatmap View Architecture

```typescript
// components/canvas/HeatmapView/HeatmapScene.tsx
interface HeatmapSceneProps {
  files: FileNode[];
  commits: CommitHistory;
  timeRange: [Date, Date];
  currentTime: Date;
}

// Terrain generation using heightmap
// Height = commit frequency in time window
// Color = recency (recent = warm, old = cool)
// Animation = interpolate between time states
```

#### Constellation View Architecture

```typescript
// components/canvas/ConstellationView/ConstellationScene.tsx
interface ConstellationSceneProps {
  contributors: Contributor[];
  fileOwnership: Map<string, string[]>;
}

// Force-directed graph using d3-force-3d
// Node mass = commit count
// Link strength = co-authorship frequency
// Runs in Web Worker to prevent jank
```

---

## 5. Backend Architecture

### 5.1 Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          API Gateway (Edge)                              │
│                         Vercel Edge Functions                            │
├─────────────────────────────────────────────────────────────────────────┤
│  /api/repo/:owner/:name          → Repository Service                    │
│  /api/repo/:owner/:name/pr/:num  → PR Diff Service                       │
│  /api/search                     → Search Service                        │
│  /api/auth/*                     → Auth Service                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
          ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
          │ Repository  │  │   Parser    │  │    Git      │
          │  Service    │  │   Workers   │  │  Service    │
          │  (Node.js)  │  │ (Rust/WASM) │  │  (Node.js)  │
          └─────────────┘  └─────────────┘  └─────────────┘
```

### 5.2 Repository Service

```typescript
// services/repository/index.ts

interface RepositoryService {
  // Fetch and cache repository structure
  getRepository(owner: string, name: string): Promise<RepositoryData>;

  // Get PR diff with dependency impact
  getPRDiff(owner: string, name: string, prNumber: number): Promise<PRDiffData>;

  // Stream parsing progress
  streamParsingProgress(jobId: string): AsyncIterable<ProgressEvent>;
}

// Processing pipeline
async function processRepository(owner: string, name: string) {
  // 1. Check cache
  const cached = await cache.get(`repo:${owner}/${name}`);
  if (cached && !isStale(cached)) return cached;

  // 2. Fetch repository metadata from GitHub API
  const metadata = await github.getRepository(owner, name);

  // 3. Clone repository (shallow)
  const repoPath = await git.shallowClone(metadata.cloneUrl);

  // 4. Parse files in parallel workers
  const parseJobs = await parser.enqueueRepository(repoPath);

  // 5. Aggregate results
  const result = await aggregateParseResults(parseJobs);

  // 6. Cache and return
  await cache.set(`repo:${owner}/${name}`, result, TTL_1_HOUR);
  return result;
}
```

### 5.3 Parser Workers

**Technology:** Tree-sitter compiled to WASM for browser + native for server

```rust
// parser-worker/src/lib.rs

pub struct ParseResult {
    pub file_path: String,
    pub language: Language,
    pub loc: u32,
    pub complexity: ComplexityMetrics,
    pub imports: Vec<Import>,
    pub exports: Vec<Export>,
    pub functions: Vec<FunctionSignature>,
    pub classes: Vec<ClassSignature>,
}

pub fn parse_file(content: &str, language: Language) -> ParseResult {
    let parser = get_parser(language);
    let tree = parser.parse(content, None).unwrap();

    // Extract metrics
    let loc = count_lines(content);
    let complexity = calculate_complexity(&tree);
    let imports = extract_imports(&tree, language);
    let exports = extract_exports(&tree, language);
    let functions = extract_functions(&tree, language);
    let classes = extract_classes(&tree, language);

    ParseResult {
        file_path: String::new(), // Set by caller
        language,
        loc,
        complexity,
        imports,
        exports,
        functions,
        classes,
    }
}
```

**Supported Languages (Phase 1):**

| Language | Parser | Import Detection |
|----------|--------|------------------|
| JavaScript | tree-sitter-javascript | `import`, `require()` |
| TypeScript | tree-sitter-typescript | `import`, `require()` |
| Python | tree-sitter-python | `import`, `from...import` |
| Go | tree-sitter-go | `import` |
| Rust | tree-sitter-rust | `use`, `mod` |

### 5.4 Git Service

```typescript
// services/git/index.ts

interface GitService {
  // Clone repository (shallow for speed)
  shallowClone(url: string, depth?: number): Promise<string>;

  // Get commit history
  getCommitHistory(repoPath: string, options?: HistoryOptions): Promise<Commit[]>;

  // Get file blame (for ownership)
  getBlame(repoPath: string, filePath: string): Promise<BlameLine[]>;

  // Get PR files
  getPRFiles(owner: string, repo: string, prNumber: number): Promise<PRFile[]>;
}

// Optimized for large repos
const CLONE_CONFIG = {
  depth: 1,                    // Shallow clone
  singleBranch: true,          // Only default branch
  filter: 'blob:none',         // Blobless clone (fetch blobs on demand)
};
```

### 5.5 Caching Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cache Layers                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  L1: Edge Cache (Vercel)           TTL: 60s                     │
│  ├── API responses                                               │
│  └── Static assets                                               │
│                                                                  │
│  L2: Redis (Upstash)               TTL: 1 hour                  │
│  ├── Parsed repository data                                      │
│  ├── Computed visualizations                                     │
│  └── User sessions                                               │
│                                                                  │
│  L3: Object Storage (R2/S3)        TTL: 24 hours                │
│  ├── Cloned repository archives                                  │
│  └── Large computed datasets                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Cache Key Structure:**

```
repo:{owner}/{name}:structure      → Directory/file tree
repo:{owner}/{name}:dependencies   → Import graph
repo:{owner}/{name}:history        → Commit history
repo:{owner}/{name}:contributors   → Contributor data
repo:{owner}/{name}:pr:{number}    → PR diff data
```

---

## 6. Data Models

### 6.1 Repository Data Model

```typescript
interface RepositoryData {
  metadata: RepositoryMetadata;
  structure: FileTree;
  dependencies: DependencyGraph;
  history: CommitHistory;
  contributors: ContributorData;
}

interface RepositoryMetadata {
  owner: string;
  name: string;
  description: string;
  defaultBranch: string;
  stars: number;
  lastUpdated: Date;
  languages: LanguageBreakdown;
}

interface FileNode {
  id: string;                    // Unique identifier
  path: string;                  // Full path from root
  name: string;                  // File name
  extension: string;             // File extension
  language: Language;            // Detected language

  // Metrics
  loc: number;                   // Lines of code
  complexity: ComplexityScore;   // Cyclomatic complexity

  // Relationships
  imports: string[];             // IDs of imported files
  importedBy: string[];          // IDs of files importing this

  // Temporal
  createdAt: Date;
  lastModified: Date;
  changeFrequency: number;       // Changes per month

  // Ownership
  primaryAuthor: string;         // GitHub username
  contributors: string[];        // All contributors
}

interface DirectoryNode {
  id: string;
  path: string;
  name: string;

  // Aggregated metrics
  totalLoc: number;
  fileCount: number;
  avgComplexity: number;

  // Children
  files: string[];               // File IDs
  directories: string[];         // Directory IDs
}

interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: DependencyEdge[];
}

interface DependencyEdge {
  source: string;                // File ID
  target: string;                // File ID
  type: 'import' | 'export' | 'extends' | 'implements';
  weight: number;                // Number of imports
}
```

### 6.2 Visualization Data Model

```typescript
// Transformed data optimized for rendering

interface CityViewData {
  districts: District[];
  buildings: Building[];
  roads: Road[];
}

interface District {
  id: string;
  directoryId: string;
  bounds: BoundingBox;
  color: Color;
  level: number;                 // Nesting depth
}

interface Building {
  id: string;
  fileId: string;
  position: Vector3;
  dimensions: Vector3;           // width, depth, height
  color: Color;
  glow: number;                  // 0-1 for highlighting
  metadata: BuildingMetadata;
}

interface Road {
  id: string;
  from: string;                  // Building ID
  to: string;                    // Building ID
  points: Vector3[];             // Path points
  intensity: number;             // Visual weight
}

interface HeatmapViewData {
  terrain: TerrainData;
  timeStates: Map<Date, TerrainState>;
}

interface TerrainData {
  resolution: [number, number];
  heightMap: Float32Array;
  colorMap: Uint8Array;
  fileMapping: Map<number, string>; // Grid index → file ID
}

interface ConstellationViewData {
  nodes: ContributorNode[];
  links: OwnershipLink[];
}

interface ContributorNode {
  id: string;
  username: string;
  avatarUrl: string;
  position: Vector3;
  size: number;
  commitCount: number;
}

interface OwnershipLink {
  source: string;
  target: string;
  strength: number;
  files: string[];
}
```

### 6.3 Cluster Data Model

```typescript
// Core cluster hierarchy structure
interface ClusterHierarchy {
  root: ClusterNode;
  levels: number;
  strategy: ClusteringStrategy;
  metadata: ClusterMetadata;
}

type ClusteringStrategy =
  | 'structural'   // Directory-based
  | 'semantic'     // Dependency-based (Louvain)
  | 'temporal'     // Co-change analysis
  | 'ownership'    // Author-based
  | 'functional';  // AI-powered

interface ClusterNode {
  id: string;
  name: string;
  level: number;                    // 0 = root, 1 = mega, 2 = module, etc.

  // Hierarchy
  parentId: string | null;
  children: ClusterNode[];
  fileIds: string[];                // Only populated at leaf level

  // Metrics
  metrics: ClusterMetrics;

  // Layout (pre-computed for rendering)
  layout: ClusterLayout;

  // Relationships to other clusters
  externalEdges: ClusterEdge[];
}

interface ClusterMetrics {
  // Size metrics
  fileCount: number;
  totalLoc: number;
  directoryCount: number;

  // Quality metrics
  cohesion: number;                 // 0-1: How tightly coupled internally
  coupling: number;                 // 0-1: How coupled to external clusters
  complexity: number;               // Average cyclomatic complexity
  healthScore: number;              // 0-100: Composite health

  // Activity metrics
  churnRate: number;                // Changes per month
  lastModified: Date;
  activeContributors: number;

  // Risk metrics
  busFactor: number;                // Min contributors who know this code
  circularDeps: number;             // Number of circular dependencies
  orphanFiles: number;              // Files with no imports/exports
}

interface ClusterLayout {
  position: Vector3;                // Center position in 3D space
  bounds: BoundingBox;              // Bounding box for the cluster
  color: Color;                     // Primary color
  size: number;                     // Visual size (based on LoC)
}

interface ClusterEdge {
  sourceClusterId: string;
  targetClusterId: string;
  weight: number;                   // Number of cross-boundary imports
  type: 'import' | 'extends' | 'implements' | 'cochange';
}

// Level-specific render data
interface LODRenderData {
  level: number;
  parentId: string | null;
  clusters: ClusterRenderNode[];
  edges: ClusterRenderEdge[];
}

interface ClusterRenderNode {
  id: string;
  name: string;
  position: Vector3;
  size: number;
  color: Color;
  glow: number;                     // Highlight intensity
  metrics: ClusterMetrics;
  hasChildren: boolean;             // Can zoom in further
}

interface ClusterRenderEdge {
  id: string;
  from: string;
  to: string;
  points: Vector3[];                // Curved path points
  weight: number;
  color: Color;
}

// Cluster summary card data
interface ClusterSummary {
  id: string;
  name: string;
  description: string;              // AI-generated summary
  metrics: ClusterMetrics;
  topFiles: FileSummary[];          // Top 5 files by importance
  primaryOwner: ContributorSummary;
  recentActivity: ActivitySummary;
  warnings: ClusterWarning[];
}

interface ClusterWarning {
  type: 'circular_dep' | 'high_churn' | 'bus_factor' | 'orphan_files' | 'god_file';
  severity: 'low' | 'medium' | 'high';
  message: string;
  affectedFiles: string[];
}
```

---

## 7. API Specifications

### 7.1 REST API Endpoints

#### Get Repository Structure
```
GET /api/repo/{owner}/{name}

Response 200:
{
  "status": "ready",
  "data": {
    "metadata": RepositoryMetadata,
    "structure": FileTree,
    "dependencies": DependencyGraph,
    "contributors": ContributorData
  },
  "cachedAt": "2025-01-26T10:00:00Z"
}

Response 202 (Processing):
{
  "status": "processing",
  "jobId": "abc123",
  "progress": 45,
  "stage": "parsing"
}
```

#### Get Repository History
```
GET /api/repo/{owner}/{name}/history?since={date}&until={date}

Response 200:
{
  "commits": Commit[],
  "fileChanges": Map<string, ChangeFrequency>
}
```

#### Get PR Diff
```
GET /api/repo/{owner}/{name}/pr/{number}

Response 200:
{
  "pr": PRMetadata,
  "changedFiles": string[],
  "impactedFiles": string[],      // Connected via dependencies
  "blastRadius": BlastRadiusData
}
```

#### Search Repository
```
POST /api/repo/{owner}/{name}/search

Body:
{
  "query": "files importing react-router",
  "type": "natural" | "regex" | "path"
}

Response 200:
{
  "results": SearchResult[],
  "filters": SuggestedFilter[]
}
```

#### Get Cluster Hierarchy
```
GET /api/repo/{owner}/{name}/clusters
  ?strategy=structural|semantic|temporal|ownership|functional

Response 200:
{
  "strategy": "semantic",
  "totalLevels": 4,
  "root": {
    "id": "root",
    "name": "facebook/react",
    "metrics": ClusterMetrics,
    "childCount": 5
  },
  "generatedAt": "2025-01-26T10:00:00Z"
}
```

#### Get Cluster Level Data
```
GET /api/repo/{owner}/{name}/clusters/level/{level}
  ?parentId={clusterId}
  &strategy=semantic

Response 200:
{
  "level": 1,
  "parentId": "root",
  "clusters": [
    {
      "id": "cluster-frontend",
      "name": "Frontend",
      "metrics": { ... },
      "position": [x, y, z],
      "size": 45000,
      "color": "#00ffff",
      "childCount": 12
    },
    ...
  ],
  "edges": [
    {
      "from": "cluster-frontend",
      "to": "cluster-shared",
      "weight": 156
    }
  ]
}
```

#### Get Cluster Details
```
GET /api/repo/{owner}/{name}/clusters/{clusterId}

Response 200:
{
  "id": "cluster-auth",
  "name": "Authentication",
  "description": "Handles user authentication, JWT tokens, and session management",
  "level": 2,
  "metrics": ClusterMetrics,
  "topFiles": [
    { "id": "...", "name": "auth-service.ts", "loc": 1204 }
  ],
  "primaryOwner": { "username": "sarah", "percentage": 62 },
  "warnings": [
    { "type": "bus_factor", "severity": "medium", "message": "..." }
  ]
}
```

#### Compare Clusters (for Comparison Mode)
```
GET /api/repo/{owner}/{name}/clusters/compare
  ?base={commitSha|branch}
  &head={commitSha|branch}
  &strategy=semantic

Response 200:
{
  "added": ClusterNode[],
  "removed": ClusterNode[],
  "modified": ClusterDiff[],
  "unchanged": string[]
}
```

### 7.2 WebSocket API

```typescript
// Real-time parsing progress

// Connect
ws://api.vizwizard.dev/ws/repo/{owner}/{name}

// Server → Client messages
interface ProgressMessage {
  type: 'progress';
  stage: 'cloning' | 'parsing' | 'analyzing' | 'ready';
  progress: number;        // 0-100
  currentFile?: string;
  eta?: number;            // seconds
}

interface DataMessage {
  type: 'data';
  chunk: 'structure' | 'dependencies' | 'history' | 'contributors';
  data: any;
}

interface ErrorMessage {
  type: 'error';
  code: string;
  message: string;
}
```

---

## 8. Frontend Milestones

### Phase 1: Foundation (Weeks 1-4)

#### Milestone F1.1: Project Setup (Week 1)
| Task | Description | Deliverable |
|------|-------------|-------------|
| F1.1.1 | Initialize Next.js 14 project with App Router | Project scaffold |
| F1.1.2 | Configure TypeScript, ESLint, Prettier | Config files |
| F1.1.3 | Set up Tailwind CSS with custom theme | Theme config |
| F1.1.4 | Configure React Three Fiber | R3F setup |
| F1.1.5 | Set up Zustand stores | Store architecture |
| F1.1.6 | Configure CI/CD pipeline | GitHub Actions |

**Testing Milestone T1.1:**
- [ ] Unit tests for store initialization
- [ ] E2E test: App loads without errors
- [ ] Lighthouse baseline score captured

#### Milestone F1.2: Basic 3D Scene (Week 2)
| Task | Description | Deliverable |
|------|-------------|-------------|
| F1.2.1 | Create canvas wrapper component | `<VisualizationCanvas>` |
| F1.2.2 | Implement camera controls (orbit, zoom, pan) | Camera system |
| F1.2.3 | Set up lighting (ambient + directional) | Lighting rig |
| F1.2.4 | Create basic building mesh component | `<Building>` |
| F1.2.5 | Implement instanced mesh for performance | `<InstancedBuildings>` |
| F1.2.6 | Add post-processing (bloom, SSAO) | Post-processing stack |

**Testing Milestone T1.2:**
- [ ] Unit tests for geometry generation
- [ ] Performance test: 1000 buildings at 60 FPS
- [ ] Visual regression test: Scene renders correctly

#### Milestone F1.3: City View Basic (Weeks 3-4)
| Task | Description | Deliverable |
|------|-------------|-------------|
| F1.3.1 | Implement treemap layout algorithm | Layout engine |
| F1.3.2 | Create district component | `<District>` |
| F1.3.3 | Implement building placement within districts | Placement logic |
| F1.3.4 | Add building coloring by file type | Color system |
| F1.3.5 | Create road/connection component | `<Road>` |
| F1.3.6 | Implement dependency connections as roads | Connection rendering |
| F1.3.7 | Add hover interactions | Hover state |
| F1.3.8 | Create contextual card component | `<ContextCard>` |

**Testing Milestone T1.3:**
- [ ] Unit tests for treemap algorithm
- [ ] Integration test: Mock data renders as city
- [ ] Performance test: 5000 files at 60 FPS
- [ ] Accessibility test: Keyboard navigation works

#### Milestone F1.4: Hierarchical Zoom System (Week 4)
| Task | Description | Deliverable |
|------|-------------|-------------|
| F1.4.1 | Implement zoom level state management | `useZoomLevel` hook |
| F1.4.2 | Create LOD switching logic | LOD manager |
| F1.4.3 | Implement smooth zoom transitions | Zoom animation |
| F1.4.4 | Create breadcrumb navigation component | `<BreadcrumbNav>` |
| F1.4.5 | Add cluster selection/drill-down | Click-to-zoom |
| F1.4.6 | Implement Level 0 (satellite) rendering | Mega-cluster view |

**Testing Milestone T1.4:**
- [ ] Unit tests for LOD switching
- [ ] Integration test: Zoom transitions work smoothly
- [ ] Performance test: Level transitions < 200ms
- [ ] E2E test: Full drill-down from L0 to L3

---

### Phase 2: Core Views (Weeks 5-8)

#### Milestone F2.1: API Integration (Week 5)
| Task | Description | Deliverable |
|------|-------------|-------------|
| F2.1.1 | Create API client with error handling | API client |
| F2.1.2 | Implement repository data fetching | `useRepository` hook |
| F2.1.3 | Add WebSocket connection for progress | Progress streaming |
| F2.1.4 | Create loading states and skeleton UI | Loading components |
| F2.1.5 | Implement error boundaries | Error handling |
| F2.1.6 | Add retry logic with exponential backoff | Resilience |

**Testing Milestone T2.1:**
- [ ] Unit tests for API client
- [ ] Integration tests with mock server
- [ ] E2E test: Real repository loads
- [ ] Error handling test: Graceful degradation

#### Milestone F2.2: Heatmap View (Week 6)
| Task | Description | Deliverable |
|------|-------------|-------------|
| F2.2.1 | Implement terrain geometry generator | Terrain engine |
| F2.2.2 | Create heightmap from file churn data | Height calculation |
| F2.2.3 | Add color gradient based on recency | Color mapping |
| F2.2.4 | Implement timeline scrubber UI | `<TimelineScrubber>` |
| F2.2.5 | Add interpolation between time states | Animation system |
| F2.2.6 | Create playback controls | Play/pause/speed |

**Testing Milestone T2.2:**
- [ ] Unit tests for terrain generation
- [ ] Unit tests for time interpolation
- [ ] Integration test: Timeline scrubbing works
- [ ] Performance test: Smooth animation at 60 FPS

#### Milestone F2.3: Constellation View (Week 7)
| Task | Description | Deliverable |
|------|-------------|-------------|
| F2.3.1 | Integrate d3-force-3d for layout | Force simulation |
| F2.3.2 | Create contributor node component | `<ContributorNode>` |
| F2.3.3 | Implement ownership link rendering | `<OwnershipLink>` |
| F2.3.4 | Add avatar loading with fallback | Avatar system |
| F2.3.5 | Implement click-to-focus behavior | Focus navigation |
| F2.3.6 | Add contributor details panel | `<ContributorPanel>` |

**Testing Milestone T2.3:**
- [ ] Unit tests for force simulation
- [ ] Integration test: Graph renders correctly
- [ ] Performance test: 100 contributors smooth

#### Milestone F2.4: View Switching & Polish (Week 8)
| Task | Description | Deliverable |
|------|-------------|-------------|
| F2.4.1 | Create view switcher component | `<ViewSwitcher>` |
| F2.4.2 | Implement smooth transitions between views | View transitions |
| F2.4.3 | Add Story Mode animation | Intro animation |
| F2.4.4 | Implement URL-based view state | Deep linking |
| F2.4.5 | Add keyboard shortcuts | Shortcut system |
| F2.4.6 | Polish interactions and animations | UX refinement |

**Testing Milestone T2.4:**
- [ ] E2E tests for view switching
- [ ] E2E tests for URL deep linking
- [ ] User testing session (5 participants)
- [ ] Accessibility audit (WCAG 2.1 AA)

---

### Phase 3: Advanced Features (Weeks 9-12)

#### Milestone F3.1: Command Palette (Week 9)
| Task | Description | Deliverable |
|------|-------------|-------------|
| F3.1.1 | Create command palette UI | `<CommandPalette>` |
| F3.1.2 | Implement fuzzy search | Search algorithm |
| F3.1.3 | Add file/function/contributor search | Multi-type search |
| F3.1.4 | Create filter application system | Filter engine |
| F3.1.5 | Implement search result highlighting | Visual feedback |
| F3.1.6 | Add keyboard navigation | A11y navigation |

**Testing Milestone T3.1:**
- [ ] Unit tests for fuzzy search
- [ ] Unit tests for filter application
- [ ] E2E test: Search → filter → visualization
- [ ] Performance test: Search 10k items < 100ms

#### Milestone F3.2: PR Diff Mode (Week 10)
| Task | Description | Deliverable |
|------|-------------|-------------|
| F3.2.1 | Create PR input UI | PR entry flow |
| F3.2.2 | Implement PR data fetching | API integration |
| F3.2.3 | Add diff highlighting in City View | Visual diff |
| F3.2.4 | Calculate and display blast radius | Impact analysis |
| F3.2.5 | Create PR summary panel | `<PRSummaryPanel>` |
| F3.2.6 | Add "affected files" list | Side panel |

**Testing Milestone T3.2:**
- [ ] Unit tests for blast radius calculation
- [ ] Integration test with real PR
- [ ] E2E test: Full PR review flow

#### Milestone F3.3: X-Ray View (Weeks 11-12)
| Task | Description | Deliverable |
|------|-------------|-------------|
| F3.3.1 | Create node-based editor canvas | Node canvas |
| F3.3.2 | Implement function node component | `<FunctionNode>` |
| F3.3.3 | Add input/output ports | Port system |
| F3.3.4 | Implement edge routing | Edge rendering |
| F3.3.5 | Add progressive disclosure (expand/collapse) | Drill-down |
| F3.3.6 | Implement cross-file usage highlighting | Cross-reference |
| F3.3.7 | Add minimap for navigation | Overview minimap |

**Testing Milestone T3.3:**
- [ ] Unit tests for node layout
- [ ] Unit tests for edge routing
- [ ] Integration test: Function graph renders
- [ ] E2E test: Progressive disclosure works

---

## 9. Backend Milestones

### Phase 1: Foundation (Weeks 1-4)

#### Milestone B1.1: Infrastructure Setup (Week 1)
| Task | Description | Deliverable |
|------|-------------|-------------|
| B1.1.1 | Set up Vercel project | Deployment config |
| B1.1.2 | Configure Edge Functions | Serverless setup |
| B1.1.3 | Set up Redis/Upstash | Cache infrastructure |
| B1.1.4 | Configure S3/R2 bucket | Blob storage |
| B1.1.5 | Set up PostgreSQL/Supabase | Database |
| B1.1.6 | Configure monitoring (Sentry, Vercel Analytics) | Observability |

**Testing Milestone T1.4:**
- [ ] Infrastructure smoke tests
- [ ] Cache connection tests
- [ ] Database migration tests

#### Milestone B1.2: GitHub Integration (Week 2)
| Task | Description | Deliverable |
|------|-------------|-------------|
| B1.2.1 | Implement GitHub OAuth flow | Auth system |
| B1.2.2 | Create GitHub API client | API wrapper |
| B1.2.3 | Implement rate limit handling | Rate limiter |
| B1.2.4 | Add repository metadata fetching | Metadata endpoint |
| B1.2.5 | Implement file tree fetching | Tree endpoint |
| B1.2.6 | Add contributor data fetching | Contributors endpoint |

**Testing Milestone T1.5:**
- [ ] Unit tests for GitHub client
- [ ] Integration tests with GitHub API
- [ ] Rate limit handling tests

#### Milestone B1.3: Git Operations (Weeks 3-4)
| Task | Description | Deliverable |
|------|-------------|-------------|
| B1.3.1 | Implement shallow clone service | Clone service |
| B1.3.2 | Add blobless clone support | Optimized clones |
| B1.3.3 | Implement commit history extraction | History service |
| B1.3.4 | Add file blame functionality | Blame service |
| B1.3.5 | Create temp directory management | Cleanup system |
| B1.3.6 | Implement PR diff fetching | PR service |

**Testing Milestone T1.6:**
- [ ] Unit tests for git operations
- [ ] Integration tests with real repos
- [ ] Large repo stress test (Linux kernel)
- [ ] Cleanup verification tests

---

### Phase 2: Parsing Pipeline (Weeks 5-8)

#### Milestone B2.1: Parser Infrastructure (Week 5)
| Task | Description | Deliverable |
|------|-------------|-------------|
| B2.1.1 | Set up Rust parser project | Parser crate |
| B2.1.2 | Integrate tree-sitter | Parser engine |
| B2.1.3 | Compile to WASM | WASM build |
| B2.1.4 | Create worker pool system | Worker management |
| B2.1.5 | Implement job queue | Queue system |
| B2.1.6 | Add progress streaming | Progress events |

**Testing Milestone T2.5:**
- [ ] Unit tests for parser
- [ ] WASM build verification
- [ ] Worker pool stress tests
- [ ] Progress event tests

#### Milestone B2.2: Language Parsers (Weeks 6-7)
| Task | Description | Deliverable |
|------|-------------|-------------|
| B2.2.1 | Implement JavaScript/TypeScript parser | JS/TS support |
| B2.2.2 | Implement Python parser | Python support |
| B2.2.3 | Implement Go parser | Go support |
| B2.2.4 | Implement Rust parser | Rust support |
| B2.2.5 | Add complexity calculation | Metrics engine |
| B2.2.6 | Implement import resolution | Dependency graph |

**Testing Milestone T2.6:**
- [ ] Parser accuracy tests per language
- [ ] Import resolution tests
- [ ] Complexity calculation tests
- [ ] Edge case tests (syntax errors, etc.)

#### Milestone B2.3: Aggregation & Caching (Week 8)
| Task | Description | Deliverable |
|------|-------------|-------------|
| B2.3.1 | Create aggregation service | Aggregator |
| B2.3.2 | Implement dependency graph builder | Graph builder |
| B2.3.3 | Add contributor aggregation | Ownership data |
| B2.3.4 | Implement cache warming | Pre-computation |
| B2.3.5 | Add incremental updates | Delta updates |
| B2.3.6 | Create cache invalidation logic | Cache management |

**Testing Milestone T2.7:**
- [ ] Aggregation correctness tests
- [ ] Cache hit/miss tests
- [ ] Incremental update tests
- [ ] Invalidation tests

#### Milestone B2.4: Clustering Engine (Week 8)
| Task | Description | Deliverable |
|------|-------------|-------------|
| B2.4.1 | Implement structural clustering | Directory-based clusterer |
| B2.4.2 | Implement Louvain algorithm for semantic clustering | Dependency-based clusterer |
| B2.4.3 | Implement co-change analysis for temporal clustering | Git history clusterer |
| B2.4.4 | Build cluster hierarchy generator | Hierarchy builder |
| B2.4.5 | Create LOD data generator | Level-specific data |
| B2.4.6 | Implement cluster naming (LLM-powered) | Name generator |
| B2.4.7 | Add cluster metrics calculation | Cohesion, coupling, health |
| B2.4.8 | Create clustering API endpoints | REST endpoints |

**Testing Milestone T2.8:**
- [ ] Unit tests for Louvain algorithm
- [ ] Unit tests for co-change matrix calculation
- [ ] Integration test: Full clustering pipeline
- [ ] Performance test: 10k files clustered < 5s
- [ ] Accuracy test: Clusters match expected modules

---

### Phase 3: API & Optimization (Weeks 9-12)

#### Milestone B3.1: API Layer (Week 9)
| Task | Description | Deliverable |
|------|-------------|-------------|
| B3.1.1 | Implement REST endpoints | REST API |
| B3.1.2 | Add WebSocket server | Real-time API |
| B3.1.3 | Implement request validation | Validation layer |
| B3.1.4 | Add response compression | Gzip/Brotli |
| B3.1.5 | Implement pagination | Pagination |
| B3.1.6 | Add API documentation | OpenAPI spec |

**Testing Milestone T3.4:**
- [ ] API contract tests
- [ ] Load tests (100 req/s)
- [ ] WebSocket connection tests
- [ ] Documentation accuracy tests

#### Milestone B3.2: Search & Intelligence (Week 10)
| Task | Description | Deliverable |
|------|-------------|-------------|
| B3.2.1 | Implement file search | Search service |
| B3.2.2 | Add function search | Code search |
| B3.2.3 | Implement natural language query parsing | NL parser |
| B3.2.4 | Add LLM integration for file summaries | AI summaries |
| B3.2.5 | Create search index | Search index |
| B3.2.6 | Implement search caching | Search cache |

**Testing Milestone T3.5:**
- [ ] Search relevance tests
- [ ] NL query parsing tests
- [ ] LLM summary quality tests
- [ ] Search performance tests

#### Milestone B3.3: Performance & Scale (Weeks 11-12)
| Task | Description | Deliverable |
|------|-------------|-------------|
| B3.3.1 | Implement response streaming | Streaming |
| B3.3.2 | Add CDN configuration | Edge caching |
| B3.3.3 | Optimize database queries | Query optimization |
| B3.3.4 | Implement connection pooling | Pool management |
| B3.3.5 | Add request coalescing | Request dedup |
| B3.3.6 | Performance profiling and tuning | Optimization |

**Testing Milestone T3.6:**
- [ ] End-to-end latency tests
- [ ] Concurrent user load tests
- [ ] Memory leak tests
- [ ] 99th percentile latency tests

---

## 10. Testing Strategy

### 10.1 Testing Pyramid

```
                    ┌───────────┐
                    │   E2E     │  10%
                    │   Tests   │
                    ├───────────┤
                    │Integration│  20%
                    │   Tests   │
                    ├───────────┤
                    │           │
                    │   Unit    │  70%
                    │   Tests   │
                    │           │
                    └───────────┘
```

### 10.2 Test Categories

#### Unit Tests
| Area | Tool | Coverage Target |
|------|------|-----------------|
| Frontend Components | Vitest + React Testing Library | 80% |
| State Management | Vitest | 90% |
| Geometry Algorithms | Vitest | 95% |
| API Client | Vitest | 85% |
| Backend Services | Jest | 85% |
| Parser Functions | Rust tests + WASM tests | 95% |

#### Integration Tests
| Area | Tool | Focus |
|------|------|-------|
| Frontend + API | MSW (Mock Service Worker) | API contracts |
| Backend + GitHub | VCR recordings | External APIs |
| Backend + Database | Testcontainers | Data layer |
| Parser + Files | Fixture files | Real code samples |

#### End-to-End Tests
| Area | Tool | Scenarios |
|------|------|-----------|
| User Flows | Playwright | Critical paths |
| Visual Regression | Percy/Chromatic | UI consistency |
| Performance | Lighthouse CI | Core Web Vitals |
| Accessibility | axe-core | WCAG compliance |

### 10.3 Testing Milestones Summary

| Phase | Milestone | Tests |
|-------|-----------|-------|
| 1 | T1.1 | Store unit tests, E2E app load |
| 1 | T1.2 | Geometry tests, performance baseline |
| 1 | T1.3 | Treemap tests, integration tests |
| 1 | T1.4 | Infrastructure smoke tests |
| 1 | T1.5 | GitHub API integration tests |
| 1 | T1.6 | Git operations tests |
| 2 | T2.1 | API client tests, error handling |
| 2 | T2.2 | Terrain generation tests |
| 2 | T2.3 | Force simulation tests |
| 2 | T2.4 | View switching E2E, accessibility |
| 2 | T2.5 | Parser unit tests, WASM tests |
| 2 | T2.6 | Language-specific parser tests |
| 2 | T2.7 | Cache and aggregation tests |
| 3 | T3.1 | Search algorithm tests |
| 3 | T3.2 | PR diff integration tests |
| 3 | T3.3 | X-Ray view tests |
| 3 | T3.4 | API contract and load tests |
| 3 | T3.5 | Search and AI tests |
| 3 | T3.6 | Performance and scale tests |

### 10.4 Quality Gates

**Pull Request Requirements:**
- [ ] All unit tests pass
- [ ] Coverage does not decrease
- [ ] No new lint errors
- [ ] Visual regression approved (if UI changes)
- [ ] Performance budget met

**Release Requirements:**
- [ ] All E2E tests pass
- [ ] Lighthouse score ≥ 90
- [ ] No critical accessibility issues
- [ ] Load test passed (100 req/s)
- [ ] Manual QA sign-off

---

## 11. DevOps & Infrastructure

### 11.1 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Preview   │  │   Staging   │  │  Production │             │
│  │  (PR-based) │  │   (main)    │  │   (tags)    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  Edge Network: Global (300+ locations)                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
├─────────────────────────────────────────────────────────────────┤
│  Upstash Redis │ Supabase PostgreSQL │ Cloudflare R2           │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml (conceptual)

Pipeline Stages:
  1. Lint & Type Check
     - ESLint
     - TypeScript
     - Prettier

  2. Unit Tests
     - Frontend (Vitest)
     - Backend (Jest)
     - Parser (Cargo test)

  3. Build
     - Next.js build
     - WASM build

  4. Integration Tests
     - API tests
     - Parser tests

  5. Deploy Preview
     - Vercel preview deployment

  6. E2E Tests
     - Playwright against preview

  7. Visual Regression
     - Percy snapshots

  8. Performance Test
     - Lighthouse CI

  9. Deploy (on merge to main)
     - Staging deployment

  10. Smoke Tests
      - Production health checks
```

### 11.3 Monitoring & Alerting

| System | Tool | Metrics |
|--------|------|---------|
| Error Tracking | Sentry | Errors, crashes |
| APM | Vercel Analytics | Core Web Vitals |
| Logs | Vercel Logs | Request logs |
| Uptime | Better Uptime | Availability |
| Custom Metrics | PostHog | Feature usage |

---

## 12. Security Considerations

### 12.1 Authentication & Authorization

| Feature | Implementation |
|---------|----------------|
| Public repos | No auth required |
| Private repos | GitHub OAuth |
| API access | JWT tokens |
| Rate limiting | Per-IP and per-user |

### 12.2 Data Security

| Concern | Mitigation |
|---------|------------|
| Repository clones | Ephemeral storage, auto-cleanup |
| Sensitive files | Never store .env, credentials |
| User data | Encrypted at rest (Supabase) |
| Transit | HTTPS only, TLS 1.3 |

### 12.3 Input Validation

| Input | Validation |
|-------|------------|
| Repository URLs | Allowlist GitHub.com only |
| Search queries | Sanitize, length limits |
| File paths | Path traversal prevention |
| PR numbers | Integer validation |

---

## 13. Performance Optimization

### 13.1 Frontend Optimizations

| Technique | Implementation | Impact |
|-----------|----------------|--------|
| Code Splitting | Next.js dynamic imports | Smaller bundles |
| Tree Shaking | Webpack optimization | Remove dead code |
| Lazy Loading | Suspense boundaries | Faster TTI |
| Asset Optimization | Next/Image, WASM compression | Smaller assets |
| Memoization | React.memo, useMemo | Reduced re-renders |
| Web Workers | Geometry computation | Unblock main thread |

### 13.2 3D Rendering Optimizations

| Technique | Implementation | Impact |
|-----------|----------------|--------|
| Instancing | InstancedMesh | 100x fewer draw calls |
| LOD | Distance-based geometry | Reduced triangles |
| Culling | Frustum + occlusion | Skip invisible |
| Batching | Merged geometries | Fewer state changes |
| Texture Atlas | Combined textures | Fewer bindings |

### 13.3 Backend Optimizations

| Technique | Implementation | Impact |
|-----------|----------------|--------|
| Edge Caching | Vercel Edge Cache | <50ms response |
| Redis Caching | Upstash | Avoid re-parsing |
| Streaming | Chunked responses | Perceived speed |
| Compression | Brotli/Gzip | 70% size reduction |
| Connection Pooling | pg-pool | Reduced latency |

### 13.4 Performance Budgets

| Metric | Budget | Measurement |
|--------|--------|-------------|
| Time to Interactive | < 3s | Lighthouse |
| First Contentful Paint | < 1.5s | Lighthouse |
| Total Blocking Time | < 200ms | Lighthouse |
| JS Bundle Size | < 500KB | Build output |
| Initial Data Payload | < 1MB | Network tab |
| Frame Rate | 60 FPS | Chrome DevTools |

---

## Appendix A: Technology Decisions

### Frontend Framework: Next.js 14
**Rationale:**
- App Router for modern React patterns
- Built-in API routes (Edge Functions)
- Excellent Vercel integration
- SSR for SEO (landing pages)

### 3D Library: React Three Fiber
**Rationale:**
- React integration (declarative)
- Ecosystem (drei, postprocessing)
- Performance (matches raw Three.js)
- TypeScript support

### State Management: Zustand
**Rationale:**
- Minimal boilerplate
- Excellent performance
- Middleware support
- DevTools integration

### Parser: Tree-sitter + WASM
**Rationale:**
- Incremental parsing
- Multi-language support
- WASM for browser compatibility
- Fast (written in C)

---

## Appendix B: Open Questions

| Question | Options | Decision Needed By |
|----------|---------|-------------------|
| GitLab/Bitbucket support timeline | Phase 2 vs Phase 4 | Phase 2 kickoff |
| Self-hosted enterprise version | Build vs Partner | Phase 3 |
| Mobile support | Responsive vs Native | Phase 2 |
| Offline mode | PWA vs Desktop app | Phase 3 |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2025 | Engineering | Initial draft |
| 1.1 | Jan 2025 | Engineering | Added Hierarchical Clustering Engine (Section 3), Cluster Data Models (Section 6.3), Clustering API endpoints, Frontend zoom system milestones, Backend clustering milestones |

---

*"Architecture is the art of how to waste space."* — Philip Johnson
(Let's not waste any.)
