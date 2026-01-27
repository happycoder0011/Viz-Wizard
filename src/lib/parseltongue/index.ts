/**
 * Parseltongue Integration Module
 *
 * Re-exports all Parseltongue-related functionality for easy imports.
 */

// Client
export {
  ParseltongueClient,
  ParseltongueError,
  createLocalClient,
  type ParseltongueConfig,
  type EntityKind,
  type CodeEntity,
  type DependencyKind,
  type Dependency,
  type CodebaseStats,
  type HotspotInfo,
  type CircularDependency,
  type BlastRadiusResult,
  type ModuleGroup,
} from './client';

// Transformer
export {
  generateFileId,
  generateConnectionId,
  classifyFile,
  mapDependencyType,
  getLanguageFromPath,
  entitiesToFileNodes,
  dependenciesToConnections,
  populateFileRelationships,
  buildRepositoryData,
  mergeGitHubWithParseltongue,
} from './transformer';

// Queries
export {
  getCriticalPathFiles,
  getBlastRadiusForFile,
  getFileUsages,
  getCircularDependencies,
  searchEntities,
  getModuleOverview,
  getFileComplexityMetrics,
  type CriticalPathScore,
  type BlastRadiusResult as BlastRadiusQueryResult,
  type FileUsages,
  type CircularDependencyInfo,
  type SearchResult,
  type ModuleOverview,
  type FileComplexityMetrics,
} from './queries';
