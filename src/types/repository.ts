// Core repository data types

export type FileExtension =
  | 'ts'
  | 'tsx'
  | 'js'
  | 'jsx'
  | 'css'
  | 'scss'
  | 'json'
  | 'md'
  | 'yaml'
  | 'html'
  | 'svg'
  | 'png'
  | 'test.ts'
  | 'test.tsx'
  | 'spec.ts'
  | 'other';

export type FileCategory =
  | 'core'       // Core business logic (cyan)
  | 'legacy'     // Legacy/JS files (amber)
  | 'style'      // Styles and assets (purple)
  | 'test'       // Test files (green)
  | 'config'     // Configuration (gray)
  | 'docs';      // Documentation (white)

export interface FileNode {
  id: string;
  name: string;
  path: string;
  extension: FileExtension;
  category: FileCategory;
  lineCount: number;
  complexity: number;       // 0-100
  imports: string[];        // IDs of imported files
  importedBy: string[];     // IDs of files that import this
  lastModified: Date;
  author: string;
  content?: string;         // Lazy-loaded file content
  language?: string;        // For syntax highlighting (typescript, javascript, css, json, markdown)
}

export interface DirectoryNode {
  id: string;
  name: string;
  path: string;
  files: FileNode[];
  directories: DirectoryNode[];
  totalLineCount: number;
  fileCount: number;
}

export interface RepositoryData {
  name: string;
  owner: string;
  description: string;
  rootDirectory: DirectoryNode;
  allFiles: FileNode[];
  connections: Connection[];
  stats: RepositoryStats;
}

export type ConnectionType =
  | 'import'      // ES import/require (cyan)
  | 'directory'   // Parent directory (gray)
  | 'call'        // Function/method call (green)
  | 'dataflow'    // Variable/data passing (purple)
  | 'extends'     // Class inheritance (amber)
  | 'implements'; // Interface implementation (amber)

export interface ConnectionMetadata {
  functionName?: string;      // For calls: name of function being called
  isAsync?: boolean;          // For calls: async function
  variableName?: string;      // For dataflow: variable name
  variableType?: string;      // For dataflow: TypeScript type
  lineNumber?: number;        // Source line number
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  weight: number;
  metadata?: ConnectionMetadata;
}

export interface RepositoryStats {
  totalFiles: number;
  totalLines: number;
  totalDirectories: number;
  languageBreakdown: Record<string, number>;
  avgComplexity: number;
}

// Visualization-specific types

export interface BuildingData {
  id: string;
  fileId: string;
  position: [number, number, number];
  dimensions: [number, number, number]; // width, height, depth
  color: string;
  emissiveColor: string;
  emissiveIntensity: number;
  metadata: {
    name: string;
    path: string;
    lineCount: number;
    complexity: number;
    category: FileCategory;
  };
}

export interface DistrictData {
  id: string;
  directoryId: string;
  name: string;
  position: [number, number, number];
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  buildings: BuildingData[];
  color: string;
}

export type LinePattern = 'solid' | 'dashed' | 'dotted';

export interface RoadData {
  id: string;
  points: [number, number, number][];
  color: string;
  width: number;
  connectionType: ConnectionType;
  pattern: LinePattern;
  sourceFileId: string;   // For highlighting on selection
  targetFileId: string;
  metadata?: ConnectionMetadata;
}

export interface CityData {
  districts: DistrictData[];
  roads: RoadData[];
  bounds: {
    width: number;
    depth: number;
  };
}

// Hierarchical Zoom Types
export type ZoomLevel = 'satellite' | 'regional' | 'district' | 'street';

export interface ZoomLevelConfig {
  level: ZoomLevel;
  minDistance: number;
  maxDistance: number;
  label: string;
  description: string;
}

export const ZOOM_LEVELS: ZoomLevelConfig[] = [
  { level: 'street', minDistance: 0, maxDistance: 15, label: 'Street', description: 'Individual files' },
  { level: 'district', minDistance: 15, maxDistance: 35, label: 'District', description: 'Directory view' },
  { level: 'regional', minDistance: 35, maxDistance: 60, label: 'Regional', description: 'Module clusters' },
  { level: 'satellite', minDistance: 60, maxDistance: Infinity, label: 'Satellite', description: 'Full codebase' },
];

// Connection type visual styles
export const CONNECTION_STYLES: Record<ConnectionType, { color: string; pattern: LinePattern; width: number }> = {
  import:     { color: '#00ffff', pattern: 'solid', width: 0.08 },   // Cyan, solid
  directory:  { color: '#666677', pattern: 'dotted', width: 0.05 }, // Gray, dotted
  call:       { color: '#00ff88', pattern: 'solid', width: 0.10 },   // Green, solid
  dataflow:   { color: '#aa66ff', pattern: 'dashed', width: 0.08 }, // Purple, dashed
  extends:    { color: '#ffaa00', pattern: 'solid', width: 0.12 },   // Amber, solid (thick)
  implements: { color: '#ffaa00', pattern: 'dashed', width: 0.10 }, // Amber, dashed
};

// Cluster data for aggregated views
export interface ClusterData {
  id: string;
  name: string;
  path: string;
  position: [number, number, number];
  radius: number;
  fileCount: number;
  totalLines: number;
  avgComplexity: number;
  dominantCategory: FileCategory;
  color: string;
  children: string[]; // IDs of buildings or sub-clusters
}

// Breadcrumb navigation
export interface BreadcrumbItem {
  id: string;
  name: string;
  path: string;
  level: ZoomLevel;
  position: [number, number, number];
}
