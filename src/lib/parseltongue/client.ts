/**
 * Parseltongue HTTP Client
 *
 * Communicates with the Parseltongue code analysis server.
 * Parseltongue provides graph-based code analysis with tree-sitter parsing
 * and CozoDB storage.
 *
 * Default server: http://localhost:7777
 */

export interface ParseltongueConfig {
  baseUrl: string;
  timeout?: number;
}

// Parseltongue entity types
export type EntityKind =
  | 'function'
  | 'class'
  | 'module'
  | 'variable'
  | 'type'
  | 'method'
  | 'struct'
  | 'enum'
  | 'interface'
  | 'trait'
  | 'constant';

export interface CodeEntity {
  id: string;
  name: string;
  kind: EntityKind;
  file_path: string;
  line_start: number;
  line_end: number;
  language: string;
  signature?: string;
  docstring?: string;
  parent_id?: string;
}

export type DependencyKind = 'calls' | 'imports' | 'extends' | 'implements' | 'uses' | 'defines';

export interface Dependency {
  source_id: string;
  target_id: string;
  kind: DependencyKind;
  line_number?: number;
}

export interface CodebaseStats {
  total_files: number;
  total_entities: number;
  total_edges: number;
  languages: Record<string, number>;
}

export interface HotspotInfo {
  entity_id: string;
  name: string;
  file_path: string;
  complexity_score: number;
  connection_count: number;
  risk_factors: string[];
}

export interface CircularDependency {
  cycle: string[];  // Entity IDs forming the cycle
  files: string[];  // File paths involved
}

export interface BlastRadiusResult {
  entity_id: string;
  affected_entities: CodeEntity[];
  hop_count: number;
}

export interface ModuleGroup {
  module_path: string;
  entities: CodeEntity[];
  entry_points: string[];
  internal_edges: number;
  external_edges: number;
}

export class ParseltongueError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'ParseltongueError';
  }
}

export class ParseltongueClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: ParseltongueConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || 30000;
  }

  /**
   * Make a request to the Parseltongue server
   */
  private async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST';
      params?: Record<string, string | number>;
      body?: unknown;
    } = {}
  ): Promise<T> {
    const { method = 'GET', params, body } = options;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        searchParams.set(key, String(value));
      }
      url += `?${searchParams.toString()}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new ParseltongueError(
          `Parseltongue request failed: ${errorText}`,
          response.status,
          endpoint
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ParseltongueError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ParseltongueError(
            `Request timeout after ${this.timeout}ms`,
            undefined,
            endpoint
          );
        }
        throw new ParseltongueError(
          `Failed to connect to Parseltongue: ${error.message}`,
          undefined,
          endpoint
        );
      }

      throw new ParseltongueError(
        'Unknown error connecting to Parseltongue',
        undefined,
        endpoint
      );
    }
  }

  // ===== Health & Stats =====

  /**
   * Check if the Parseltongue server is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/server-health-check-status');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get codebase statistics overview
   */
  async getStats(): Promise<CodebaseStats> {
    return this.request<CodebaseStats>('/codebase-statistics-overview-summary');
  }

  // ===== Entity Queries =====

  /**
   * Fuzzy search for code entities by name
   */
  async searchEntities(query: string): Promise<CodeEntity[]> {
    return this.request<CodeEntity[]>('/code-entities-search-fuzzy', {
      params: { q: query },
    });
  }

  /**
   * Get a specific entity by ID
   */
  async getEntity(id: string): Promise<CodeEntity | null> {
    try {
      return await this.request<CodeEntity>('/code-entity-by-id', {
        params: { id },
      });
    } catch (error) {
      if (error instanceof ParseltongueError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get all entities defined in a specific file
   */
  async getEntitiesInFile(filePath: string): Promise<CodeEntity[]> {
    return this.request<CodeEntity[]>('/code-entities-in-file', {
      params: { file: filePath },
    });
  }

  /**
   * Get all entities of a specific kind
   */
  async getEntitiesByKind(kind: EntityKind): Promise<CodeEntity[]> {
    return this.request<CodeEntity[]>('/code-entities-by-kind', {
      params: { kind },
    });
  }

  // ===== Relationship Queries =====

  /**
   * Get entities that call/use the given entity (reverse callers)
   */
  async getCallers(entityId: string): Promise<CodeEntity[]> {
    return this.request<CodeEntity[]>('/reverse-callers-query-graph', {
      params: { entity: entityId },
    });
  }

  /**
   * Get entities that the given entity calls/uses
   */
  async getCallees(entityId: string): Promise<CodeEntity[]> {
    return this.request<CodeEntity[]>('/forward-callees-query-graph', {
      params: { entity: entityId },
    });
  }

  /**
   * Get the blast radius - all entities affected if this one changes
   */
  async getBlastRadius(entityId: string, hops: number = 3): Promise<BlastRadiusResult> {
    return this.request<BlastRadiusResult>('/blast-radius-impact-analysis', {
      params: { entity: entityId, hops },
    });
  }

  /**
   * Get all dependencies (edges) in the codebase
   */
  async getAllDependencies(): Promise<Dependency[]> {
    return this.request<Dependency[]>('/all-dependencies-list');
  }

  /**
   * Get dependencies for a specific entity
   */
  async getEntityDependencies(entityId: string): Promise<{
    incoming: Dependency[];
    outgoing: Dependency[];
  }> {
    return this.request('/entity-dependencies', {
      params: { entity: entityId },
    });
  }

  // ===== Analysis =====

  /**
   * Get complexity hotspots - files/entities with highest risk
   */
  async getHotspots(top: number = 20): Promise<HotspotInfo[]> {
    return this.request<HotspotInfo[]>('/complexity-hotspots-ranking-view', {
      params: { top },
    });
  }

  /**
   * Detect circular dependencies in the codebase
   */
  async getCircularDependencies(): Promise<CircularDependency[]> {
    return this.request<CircularDependency[]>('/circular-dependency-detection-scan');
  }

  /**
   * Get module groupings (directories/namespaces with their entities)
   */
  async getModuleGroups(): Promise<ModuleGroup[]> {
    return this.request<ModuleGroup[]>('/module-groups-overview');
  }

  /**
   * Get file-level complexity metrics
   */
  async getFileComplexity(filePath: string): Promise<{
    file_path: string;
    total_complexity: number;
    entity_count: number;
    avg_complexity_per_entity: number;
    max_complexity_entity: string | null;
  }> {
    return this.request('/file-complexity-metrics', {
      params: { file: filePath },
    });
  }

  // ===== Batch Operations =====

  /**
   * Get all entities in the codebase
   */
  async getAllEntities(): Promise<CodeEntity[]> {
    return this.request<CodeEntity[]>('/all-entities-list');
  }

  /**
   * Get entities with their relationships in a single call
   */
  async getEntitiesWithRelationships(): Promise<{
    entities: CodeEntity[];
    dependencies: Dependency[];
  }> {
    return this.request('/full-graph-export');
  }
}

// Default client instance pointing to localhost
export function createLocalClient(port: number = 7777): ParseltongueClient {
  return new ParseltongueClient({
    baseUrl: `http://localhost:${port}`,
    timeout: 30000,
  });
}

export default ParseltongueClient;
