import {
  FileNode,
  DirectoryNode,
  RepositoryData,
  Connection,
  FileExtension,
  FileCategory,
  BuildingData,
  DistrictData,
  RoadData,
  CityData,
  CONNECTION_STYLES,
} from '@/types/repository';

// Color mapping for file categories
export const CATEGORY_COLORS: Record<FileCategory, { main: string; emissive: string }> = {
  core: { main: '#00cccc', emissive: '#00ffff' },      // Cyan - TypeScript/Core logic
  legacy: { main: '#cc8800', emissive: '#ffaa00' },   // Amber - Legacy JS
  style: { main: '#8844cc', emissive: '#aa66ff' },    // Purple - Styles
  test: { main: '#00cc66', emissive: '#00ff88' },     // Green - Tests
  config: { main: '#444455', emissive: '#666677' },   // Gray - Config
  docs: { main: '#888899', emissive: '#aaaacc' },     // Light gray - Docs
};

// Map extensions to categories
function getFileCategory(extension: FileExtension, name: string): FileCategory {
  if (name.includes('.test.') || name.includes('.spec.') || name.includes('__tests__')) {
    return 'test';
  }
  if (['css', 'scss', 'svg', 'png'].includes(extension)) {
    return 'style';
  }
  if (['json', 'yaml', 'html'].includes(extension)) {
    return 'config';
  }
  if (extension === 'md') {
    return 'docs';
  }
  if (['js', 'jsx'].includes(extension)) {
    return 'legacy';
  }
  return 'core';
}

// Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Generate random number in range
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Mock file names by category
const FILE_NAMES: Record<string, string[]> = {
  components: [
    'Button', 'Card', 'Modal', 'Header', 'Footer', 'Sidebar', 'Navigation',
    'Avatar', 'Badge', 'Tooltip', 'Dropdown', 'Table', 'Form', 'Input',
    'Select', 'Checkbox', 'Radio', 'Toggle', 'Tabs', 'Accordion', 'Alert',
    'Toast', 'Spinner', 'Progress', 'Skeleton', 'Breadcrumb', 'Pagination',
  ],
  hooks: [
    'useAuth', 'useApi', 'useForm', 'useModal', 'useToast', 'useTheme',
    'useLocalStorage', 'useDebounce', 'useClickOutside', 'useMediaQuery',
    'usePrevious', 'useAsync', 'useInterval', 'useKeyPress', 'useHover',
  ],
  utils: [
    'api', 'helpers', 'validators', 'formatters', 'constants', 'types',
    'logger', 'storage', 'analytics', 'errorHandler', 'dateUtils', 'stringUtils',
  ],
  services: [
    'AuthService', 'ApiService', 'UserService', 'NotificationService',
    'StorageService', 'AnalyticsService', 'WebSocketService', 'CacheService',
  ],
  pages: [
    'Home', 'Dashboard', 'Profile', 'Settings', 'Login', 'Register',
    'NotFound', 'Error', 'About', 'Contact', 'Pricing', 'Blog',
  ],
};

// Generate a single file
function generateFile(
  name: string,
  directory: string,
  extension: FileExtension
): FileNode {
  const fullName = `${name}.${extension}`;
  const path = `${directory}/${fullName}`;
  const category = getFileCategory(extension, fullName);

  return {
    id: generateId(),
    name: fullName,
    path,
    extension,
    category,
    lineCount: randomInRange(20, 800),
    complexity: randomInRange(10, 90),
    imports: [],
    importedBy: [],
    lastModified: new Date('2025-01-01'),
    author: ['alice', 'bob', 'charlie', 'diana', 'eve'][randomInRange(0, 4)],
  };
}

// Generate a directory with files
function generateDirectory(
  name: string,
  parentPath: string,
  depth: number,
  maxDepth: number
): DirectoryNode {
  const path = parentPath ? `${parentPath}/${name}` : name;
  const files: FileNode[] = [];
  const directories: DirectoryNode[] = [];

  // Generate files based on directory name
  const fileNames = FILE_NAMES[name] || FILE_NAMES.utils;
  const numFiles = randomInRange(3, Math.min(fileNames.length, 12));
  const selectedFiles = [...fileNames].sort(() => Math.random() - 0.5).slice(0, numFiles);

  selectedFiles.forEach((fileName) => {
    // Determine extension based on directory
    let extensions: FileExtension[] = ['ts', 'tsx'];
    if (name === 'styles') extensions = ['css', 'scss'];
    if (name === 'config') extensions = ['json', 'yaml'];

    const ext = extensions[randomInRange(0, extensions.length - 1)];
    files.push(generateFile(fileName, path, ext));

    // Add test file for some components
    if (Math.random() > 0.6 && (ext === 'ts' || ext === 'tsx')) {
      files.push(generateFile(`${fileName}.test`, path, ext));
    }
  });

  // Add index file
  files.push(generateFile('index', path, 'ts'));

  // Generate subdirectories
  if (depth < maxDepth) {
    const subDirNames = ['__tests__', 'types', 'helpers'];
    const numSubDirs = randomInRange(0, 2);

    for (let i = 0; i < numSubDirs; i++) {
      if (subDirNames[i]) {
        directories.push(generateDirectory(subDirNames[i], path, depth + 1, maxDepth));
      }
    }
  }

  const totalLineCount = files.reduce((sum, f) => sum + f.lineCount, 0) +
    directories.reduce((sum, d) => sum + d.totalLineCount, 0);

  const fileCount = files.length +
    directories.reduce((sum, d) => sum + d.fileCount, 0);

  return {
    id: generateId(),
    name,
    path,
    files,
    directories,
    totalLineCount,
    fileCount,
  };
}

// Generate connections between files (imports)
function generateConnections(allFiles: FileNode[]): Connection[] {
  const connections: Connection[] = [];
  const fileMap = new Map(allFiles.map(f => [f.id, f]));

  allFiles.forEach((file) => {
    if (file.category === 'core' || file.category === 'legacy') {
      // Each file imports 1-5 other files
      const numImports = randomInRange(1, 5);
      const potentialImports = allFiles.filter(
        f => f.id !== file.id && f.category !== 'test' && f.category !== 'docs'
      );

      const shuffled = [...potentialImports].sort(() => Math.random() - 0.5);
      const imports = shuffled.slice(0, numImports);

      imports.forEach((importedFile) => {
        // Initialize arrays if undefined
        if (!file.imports) file.imports = [];
        if (!importedFile.importedBy) importedFile.importedBy = [];

        file.imports.push(importedFile.id);
        importedFile.importedBy.push(file.id);

        connections.push({
          id: generateId(),
          sourceId: file.id,
          targetId: importedFile.id,
          type: 'import',
          weight: randomInRange(1, 5),
        });
      });
    }
  });

  return connections;
}

// Generate complete mock repository
export function generateMockRepository(
  owner: string = 'acme-corp',
  name: string = 'viz-wizard'
): RepositoryData {
  // Root directory structure
  const rootDirectories = [
    'components',
    'hooks',
    'utils',
    'services',
    'pages',
    'styles',
    'config',
  ];

  const srcDirectory: DirectoryNode = {
    id: generateId(),
    name: 'src',
    path: 'src',
    files: [
      generateFile('App', 'src', 'tsx'),
      generateFile('main', 'src', 'ts'),
      generateFile('index', 'src', 'ts'),
    ],
    directories: rootDirectories.map(dir =>
      generateDirectory(dir, 'src', 1, 3)
    ),
    totalLineCount: 0,
    fileCount: 0,
  };

  // Calculate totals
  srcDirectory.totalLineCount = srcDirectory.files.reduce((sum, f) => sum + f.lineCount, 0) +
    srcDirectory.directories.reduce((sum, d) => sum + d.totalLineCount, 0);
  srcDirectory.fileCount = srcDirectory.files.length +
    srcDirectory.directories.reduce((sum, d) => sum + d.fileCount, 0);

  // Collect all files
  const allFiles: FileNode[] = [];
  function collectFiles(dir: DirectoryNode) {
    allFiles.push(...dir.files);
    dir.directories.forEach(collectFiles);
  }
  collectFiles(srcDirectory);

  // Generate connections
  const connections = generateConnections(allFiles);

  // Calculate stats
  const languageBreakdown: Record<string, number> = {};
  allFiles.forEach((file) => {
    const ext = file.extension;
    languageBreakdown[ext] = (languageBreakdown[ext] || 0) + 1;
  });

  const stats = {
    totalFiles: allFiles.length,
    totalLines: allFiles.reduce((sum, f) => sum + f.lineCount, 0),
    totalDirectories: 1 + srcDirectory.directories.length,
    languageBreakdown,
    avgComplexity: allFiles.reduce((sum, f) => sum + f.complexity, 0) / allFiles.length,
  };

  return {
    name,
    owner,
    description: 'A beautiful codebase visualization tool',
    rootDirectory: srcDirectory,
    allFiles,
    connections,
    stats,
  };
}

// Group files by top-level directory from flat file list
function groupFilesByTopDirectory(files: FileNode[]): Map<string, FileNode[]> {
  const groups = new Map<string, FileNode[]>();

  for (const file of files) {
    // Get top-level directory (first path segment)
    const pathParts = file.path.split('/');
    const topDir = pathParts.length > 1 ? pathParts[0] : '(root)';

    const existing = groups.get(topDir) || [];
    existing.push(file);
    groups.set(topDir, existing);
  }

  return groups;
}

// Convert repository data to city visualization data
export function repositoryToCityData(repo: RepositoryData): CityData {
  const districts: DistrictData[] = [];
  const roads: RoadData[] = [];
  const filePositions = new Map<string, [number, number, number]>();

  const DISTRICT_SPACING = 25;
  const BUILDING_SPACING = 3;
  const HEIGHT_SCALE = 0.02; // Scale line count to building height

  let districtIndex = 0;

  // Determine districts: use rootDirectory if available, otherwise group by path
  interface DirectoryGroup {
    name: string;
    id: string;
    files: FileNode[];
  }

  let directoryGroups: DirectoryGroup[] = [];

  if (repo.rootDirectory) {
    // Use tree structure - collect files from each top-level directory
    directoryGroups = repo.rootDirectory.directories.map(dir => {
      const allDirFiles: FileNode[] = [];
      function collectDirFiles(d: DirectoryNode) {
        allDirFiles.push(...d.files);
        d.directories.forEach(collectDirFiles);
      }
      collectDirFiles(dir);
      return { name: dir.name, id: dir.id, files: allDirFiles };
    });
  } else {
    // Use flat file list - group by top-level directory
    const grouped = groupFilesByTopDirectory(repo.allFiles);
    directoryGroups = Array.from(grouped.entries()).map(([name, files]) => ({
      name,
      id: `dir-${name}`,
      files,
    }));
  }

  // Create a district for each directory group
  directoryGroups.forEach((group) => {
    const districtX = (districtIndex % 3) * DISTRICT_SPACING - DISTRICT_SPACING;
    const districtZ = Math.floor(districtIndex / 3) * DISTRICT_SPACING - DISTRICT_SPACING;

    const buildings: BuildingData[] = [];
    let buildingIndex = 0;

    // Create buildings for each file
    group.files.forEach((file) => {
      const localX = (buildingIndex % 5) * BUILDING_SPACING - 6;
      const localZ = Math.floor(buildingIndex / 5) * BUILDING_SPACING - 6;

      const position: [number, number, number] = [
        districtX + localX,
        0,
        districtZ + localZ,
      ];

      const height = Math.max(0.5, file.lineCount * HEIGHT_SCALE);
      const width = 1.5 + (file.complexity / 100) * 0.5;
      const depth = 1.5 + ((file.imports?.length || 0) / 10) * 0.3;

      const colors = CATEGORY_COLORS[file.category];

      const building: BuildingData = {
        id: generateId(),
        fileId: file.id,
        position: [position[0], height / 2, position[2]],
        dimensions: [width, height, depth],
        color: colors.main,
        emissiveColor: colors.emissive,
        emissiveIntensity: 0.3 + (file.complexity / 100) * 0.5,
        metadata: {
          name: file.name,
          path: file.path,
          lineCount: file.lineCount,
          complexity: file.complexity,
          category: file.category,
        },
      };

      buildings.push(building);
      filePositions.set(file.id, building.position);
      buildingIndex++;
    });

    // Calculate district bounds
    const allX = buildings.map(b => b.position[0]);
    const allZ = buildings.map(b => b.position[2]);

    const district: DistrictData = {
      id: generateId(),
      directoryId: group.id,
      name: group.name,
      position: [districtX, 0, districtZ],
      bounds: {
        minX: Math.min(...allX) - 2,
        maxX: Math.max(...allX) + 2,
        minZ: Math.min(...allZ) - 2,
        maxZ: Math.max(...allZ) + 2,
      },
      buildings,
      color: CATEGORY_COLORS.core.main,
    };

    districts.push(district);
    districtIndex++;
  });

  // Create roads (connections between files)
  repo.connections.forEach((connection) => {
    const sourcePos = filePositions.get(connection.sourceId);
    const targetPos = filePositions.get(connection.targetId);

    if (sourcePos && targetPos) {
      // Create a curved path
      const midX = (sourcePos[0] + targetPos[0]) / 2;
      const midZ = (sourcePos[2] + targetPos[2]) / 2;
      const midY = 0.1 + Math.random() * 0.2;

      // Get style based on connection type
      const style = CONNECTION_STYLES[connection.type] || CONNECTION_STYLES.import;

      const road: RoadData = {
        id: connection.id,
        points: [
          [sourcePos[0], 0.1, sourcePos[2]],
          [midX, midY, midZ],
          [targetPos[0], 0.1, targetPos[2]],
        ],
        color: style.color,
        width: style.width + connection.weight * 0.01,
        connectionType: connection.type,
        pattern: style.pattern,
        sourceFileId: connection.sourceId,
        targetFileId: connection.targetId,
        metadata: connection.metadata,
      };

      roads.push(road);
    }
  });

  // Calculate overall bounds
  const allDistrictBounds = districts.flatMap(d => [
    d.bounds.minX, d.bounds.maxX, d.bounds.minZ, d.bounds.maxZ
  ]);

  return {
    districts,
    roads,
    bounds: {
      width: Math.max(...allDistrictBounds.filter((_, i) => i % 2 === 1)) -
             Math.min(...allDistrictBounds.filter((_, i) => i % 2 === 0)) + 20,
      depth: Math.max(...allDistrictBounds.filter((_, i) => i >= 2)) -
             Math.min(...allDistrictBounds.filter((_, i) => i >= 2)) + 20,
    },
  };
}
