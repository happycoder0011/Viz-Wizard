/**
 * Mock Data Fixtures for Testing Different Visualization Scenarios
 *
 * These fixtures help test:
 * - Different repository sizes (small, medium, large)
 * - Edge cases (orphan files, high churn, god files)
 * - Different clustering strategies
 * - Timeline/temporal data
 * - Contributor patterns
 */

import {
  FileNode,
  DirectoryNode,
  RepositoryData,
  Connection,
  FileCategory,
  FileExtension,
  ConnectionType,
  ConnectionMetadata,
} from '@/types/repository';
import { generateMockContent, getLanguageFromExtension } from './mockContent';

// Helper to generate IDs
let idCounter = 0;
const generateId = () => `file-${++idCounter}`;

// Helper to create a file node
function createFile(
  name: string,
  path: string,
  options: Partial<FileNode> = {}
): FileNode {
  const extension = name.split('.').pop() as FileExtension || 'ts';
  const isTest = name.includes('.test.') || name.includes('.spec.');

  let category: FileCategory = 'core';
  if (isTest) category = 'test';
  else if (['css', 'scss', 'svg'].includes(extension)) category = 'style';
  else if (['json', 'yaml', 'yml'].includes(extension)) category = 'config';
  else if (extension === 'md') category = 'docs';
  else if (['js', 'jsx'].includes(extension)) category = 'legacy';

  // Generate mock content and language
  const language = getLanguageFromExtension(extension);
  const content = generateMockContent(name, extension, category);

  return {
    id: generateId(),
    name,
    path: `${path}/${name}`,
    extension,
    category,
    lineCount: options.lineCount ?? Math.floor(Math.random() * 300) + 50,
    complexity: options.complexity ?? Math.floor(Math.random() * 80) + 10,
    imports: options.imports ?? [],
    importedBy: options.importedBy ?? [],
    lastModified: options.lastModified ?? new Date('2025-01-01'),
    author: options.author ?? 'developer',
    content,
    language,
    ...options,
  };
}

// ============================================================================
// FIXTURE 1: Small Repository (Startup MVP)
// ~20 files, simple structure, good for initial testing
// ============================================================================
export function createSmallRepository(): RepositoryData {
  idCounter = 0;

  const files: FileNode[] = [
    // Core app files
    createFile('App.tsx', 'src', { lineCount: 150, complexity: 35 }),
    createFile('main.ts', 'src', { lineCount: 25, complexity: 10 }),
    createFile('index.ts', 'src', { lineCount: 10, complexity: 5 }),

    // Components
    createFile('Button.tsx', 'src/components', { lineCount: 80, complexity: 25 }),
    createFile('Card.tsx', 'src/components', { lineCount: 120, complexity: 30 }),
    createFile('Header.tsx', 'src/components', { lineCount: 90, complexity: 28 }),
    createFile('Footer.tsx', 'src/components', { lineCount: 60, complexity: 15 }),

    // Hooks
    createFile('useAuth.ts', 'src/hooks', { lineCount: 150, complexity: 55 }),
    createFile('useApi.ts', 'src/hooks', { lineCount: 200, complexity: 65 }),

    // Utils
    createFile('helpers.ts', 'src/utils', { lineCount: 100, complexity: 40 }),
    createFile('constants.ts', 'src/utils', { lineCount: 50, complexity: 5 }),

    // Styles
    createFile('globals.css', 'src/styles', { lineCount: 200, complexity: 20 }),
    createFile('variables.scss', 'src/styles', { lineCount: 80, complexity: 10 }),

    // Config
    createFile('config.json', 'src', { lineCount: 30, complexity: 5 }),

    // Tests
    createFile('App.test.tsx', 'src/__tests__', { lineCount: 100, complexity: 30 }),
    createFile('Button.test.tsx', 'src/__tests__', { lineCount: 80, complexity: 25 }),
  ];

  // Create simple connections
  const connections: Connection[] = [
    { id: 'c1', sourceId: files[0].id, targetId: files[3].id, type: 'import', weight: 3 },
    { id: 'c2', sourceId: files[0].id, targetId: files[4].id, type: 'import', weight: 2 },
    { id: 'c3', sourceId: files[0].id, targetId: files[7].id, type: 'import', weight: 5 },
    { id: 'c4', sourceId: files[3].id, targetId: files[11].id, type: 'import', weight: 1 },
    { id: 'c5', sourceId: files[7].id, targetId: files[8].id, type: 'import', weight: 4 },
  ];

  // Update import references
  files[0].imports = [files[3].id, files[4].id, files[7].id];
  files[3].importedBy = [files[0].id];
  files[4].importedBy = [files[0].id];
  files[7].importedBy = [files[0].id];

  return {
    name: 'startup-mvp',
    owner: 'acme',
    description: 'A small startup MVP project',
    rootDirectory: buildDirectoryTree(files),
    allFiles: files,
    connections,
    stats: calculateStats(files),
  };
}

// ============================================================================
// FIXTURE 2: Medium Repository (Standard SaaS App)
// ~100 files, realistic structure
// ============================================================================
export function createMediumRepository(): RepositoryData {
  idCounter = 0;

  const files: FileNode[] = [];
  const authors = ['alice', 'bob', 'charlie', 'diana', 'eve'];

  // Generate component files
  const componentNames = [
    'Button', 'Card', 'Modal', 'Header', 'Footer', 'Sidebar', 'Navigation',
    'Avatar', 'Badge', 'Tooltip', 'Dropdown', 'Table', 'Form', 'Input',
    'Select', 'Checkbox', 'Radio', 'Toggle', 'Tabs', 'Accordion',
  ];

  componentNames.forEach((name) => {
    files.push(createFile(`${name}.tsx`, 'src/components', {
      lineCount: Math.floor(Math.random() * 200) + 50,
      complexity: Math.floor(Math.random() * 60) + 20,
      author: authors[Math.floor(Math.random() * authors.length)],
    }));
    // Add test for some components
    if (Math.random() > 0.5) {
      files.push(createFile(`${name}.test.tsx`, 'src/components/__tests__', {
        lineCount: Math.floor(Math.random() * 100) + 30,
        complexity: Math.floor(Math.random() * 30) + 10,
      }));
    }
  });

  // Generate hook files
  const hookNames = [
    'useAuth', 'useApi', 'useForm', 'useModal', 'useToast', 'useTheme',
    'useLocalStorage', 'useDebounce', 'useClickOutside', 'useMediaQuery',
  ];

  hookNames.forEach((name) => {
    files.push(createFile(`${name}.ts`, 'src/hooks', {
      lineCount: Math.floor(Math.random() * 150) + 80,
      complexity: Math.floor(Math.random() * 70) + 30,
      author: authors[Math.floor(Math.random() * authors.length)],
    }));
  });

  // Generate service files
  const serviceNames = [
    'AuthService', 'ApiService', 'UserService', 'PaymentService',
    'NotificationService', 'AnalyticsService',
  ];

  serviceNames.forEach((name) => {
    files.push(createFile(`${name}.ts`, 'src/services', {
      lineCount: Math.floor(Math.random() * 300) + 100,
      complexity: Math.floor(Math.random() * 80) + 40,
      author: authors[Math.floor(Math.random() * authors.length)],
    }));
  });

  // Generate page files
  const pageNames = [
    'Home', 'Dashboard', 'Profile', 'Settings', 'Login', 'Register',
    'NotFound', 'Error',
  ];

  pageNames.forEach((name) => {
    files.push(createFile(`${name}.tsx`, 'src/pages', {
      lineCount: Math.floor(Math.random() * 250) + 100,
      complexity: Math.floor(Math.random() * 60) + 25,
      author: authors[Math.floor(Math.random() * authors.length)],
    }));
  });

  // Utils
  files.push(createFile('helpers.ts', 'src/utils', { lineCount: 200, complexity: 45 }));
  files.push(createFile('validators.ts', 'src/utils', { lineCount: 150, complexity: 55 }));
  files.push(createFile('formatters.ts', 'src/utils', { lineCount: 100, complexity: 30 }));
  files.push(createFile('constants.ts', 'src/utils', { lineCount: 80, complexity: 5 }));
  files.push(createFile('types.ts', 'src/utils', { lineCount: 200, complexity: 10 }));

  // Styles
  files.push(createFile('globals.css', 'src/styles', { lineCount: 300, complexity: 25 }));
  files.push(createFile('variables.scss', 'src/styles', { lineCount: 100, complexity: 10 }));
  files.push(createFile('animations.css', 'src/styles', { lineCount: 150, complexity: 20 }));

  // Config
  files.push(createFile('config.ts', 'src/config', { lineCount: 50, complexity: 15 }));
  files.push(createFile('routes.ts', 'src/config', { lineCount: 80, complexity: 20 }));
  files.push(createFile('api.ts', 'src/config', { lineCount: 60, complexity: 10 }));

  // Generate random connections
  const connections = generateConnections(files, 0.15);

  return {
    name: 'saas-platform',
    owner: 'company',
    description: 'A medium-sized SaaS platform',
    rootDirectory: buildDirectoryTree(files),
    allFiles: files,
    connections,
    stats: calculateStats(files),
  };
}

// ============================================================================
// FIXTURE 3: Large Repository (Enterprise Monorepo)
// ~500 files, complex structure, tests performance
// ============================================================================
export function createLargeRepository(): RepositoryData {
  idCounter = 0;

  const files: FileNode[] = [];
  const authors = ['alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'grace', 'henry'];

  // Multiple packages/apps
  const packages = ['web', 'mobile', 'api', 'shared', 'admin'];

  packages.forEach((pkg) => {
    // Components for each package
    for (let i = 0; i < 30; i++) {
      files.push(createFile(`Component${i}.tsx`, `packages/${pkg}/src/components`, {
        lineCount: Math.floor(Math.random() * 300) + 50,
        complexity: Math.floor(Math.random() * 80) + 10,
        author: authors[Math.floor(Math.random() * authors.length)],
      }));
    }

    // Hooks
    for (let i = 0; i < 10; i++) {
      files.push(createFile(`useHook${i}.ts`, `packages/${pkg}/src/hooks`, {
        lineCount: Math.floor(Math.random() * 200) + 50,
        complexity: Math.floor(Math.random() * 70) + 20,
        author: authors[Math.floor(Math.random() * authors.length)],
      }));
    }

    // Services
    for (let i = 0; i < 8; i++) {
      files.push(createFile(`Service${i}.ts`, `packages/${pkg}/src/services`, {
        lineCount: Math.floor(Math.random() * 400) + 100,
        complexity: Math.floor(Math.random() * 90) + 30,
        author: authors[Math.floor(Math.random() * authors.length)],
      }));
    }

    // Utils
    for (let i = 0; i < 5; i++) {
      files.push(createFile(`util${i}.ts`, `packages/${pkg}/src/utils`, {
        lineCount: Math.floor(Math.random() * 150) + 30,
        complexity: Math.floor(Math.random() * 50) + 10,
        author: authors[Math.floor(Math.random() * authors.length)],
      }));
    }

    // Tests
    for (let i = 0; i < 15; i++) {
      files.push(createFile(`test${i}.test.ts`, `packages/${pkg}/src/__tests__`, {
        lineCount: Math.floor(Math.random() * 200) + 50,
        complexity: Math.floor(Math.random() * 40) + 10,
      }));
    }
  });

  // Shared types and configs
  for (let i = 0; i < 10; i++) {
    files.push(createFile(`types${i}.ts`, 'packages/shared/types', {
      lineCount: Math.floor(Math.random() * 100) + 50,
      complexity: 10,
    }));
  }

  const connections = generateConnections(files, 0.05); // Lower density for large repo

  return {
    name: 'enterprise-monorepo',
    owner: 'megacorp',
    description: 'A large enterprise monorepo',
    rootDirectory: buildDirectoryTree(files),
    allFiles: files,
    connections,
    stats: calculateStats(files),
  };
}

// ============================================================================
// FIXTURE 4: Edge Cases Repository
// Tests specific visualization scenarios
// ============================================================================
export function createEdgeCasesRepository(): RepositoryData {
  idCounter = 0;

  const files: FileNode[] = [
    // GOD FILE - Very large, high complexity
    createFile('GodClass.ts', 'src', {
      lineCount: 2500,
      complexity: 95,
      author: 'legacy-dev',
    }),

    // ORPHAN FILES - No imports/exports
    createFile('orphan1.ts', 'src/orphans', {
      lineCount: 50,
      complexity: 20,
      imports: [],
      importedBy: [],
    }),
    createFile('orphan2.ts', 'src/orphans', {
      lineCount: 30,
      complexity: 15,
      imports: [],
      importedBy: [],
    }),
    createFile('deadCode.ts', 'src/orphans', {
      lineCount: 200,
      complexity: 40,
      imports: [],
      importedBy: [],
    }),

    // HIGH CHURN FILES - Changed frequently (simulated)
    createFile('frequentlyChanged.ts', 'src/hotspots', {
      lineCount: 300,
      complexity: 70,
      author: 'everyone',
    }),

    // TINY FILES - Very small
    createFile('tiny1.ts', 'src/micro', { lineCount: 5, complexity: 2 }),
    createFile('tiny2.ts', 'src/micro', { lineCount: 8, complexity: 3 }),
    createFile('tiny3.ts', 'src/micro', { lineCount: 3, complexity: 1 }),

    // HIGHLY CONNECTED - Many imports
    createFile('hub.ts', 'src/core', { lineCount: 400, complexity: 80 }),

    // Test files
    createFile('GodClass.test.ts', 'src/__tests__', { lineCount: 500, complexity: 60 }),

    // Config explosion
    ...Array.from({ length: 15 }, (_, i) =>
      createFile(`config${i}.json`, 'config', { lineCount: 20, complexity: 5 })
    ),

    // Deep nesting
    createFile('deep.ts', 'src/a/b/c/d/e/f/g', { lineCount: 100, complexity: 30 }),

    // Mixed extensions
    createFile('legacy.js', 'src/legacy', { lineCount: 500, complexity: 85 }),
    createFile('styles.css', 'src/styles', { lineCount: 800, complexity: 30 }),
    createFile('README.md', 'docs', { lineCount: 200, complexity: 5 }),
  ];

  // Create hub connections (hub.ts imports many files)
  const hubFile = files.find(f => f.name === 'hub.ts')!;
  const connections: Connection[] = [];

  files.forEach((file) => {
    if (file.id !== hubFile.id && file.category === 'core') {
      connections.push({
        id: `c-${hubFile.id}-${file.id}`,
        sourceId: hubFile.id,
        targetId: file.id,
        type: 'import',
        weight: Math.floor(Math.random() * 5) + 1,
      });
      if (!hubFile.imports) hubFile.imports = [];
      if (!file.importedBy) file.importedBy = [];
      hubFile.imports.push(file.id);
      file.importedBy.push(hubFile.id);
    }
  });

  return {
    name: 'edge-cases',
    owner: 'test',
    description: 'Repository with edge cases for testing',
    rootDirectory: buildDirectoryTree(files),
    allFiles: files,
    connections,
    stats: calculateStats(files),
  };
}

// ============================================================================
// FIXTURE 5: Temporal Data (for Heatmap View)
// Includes commit history simulation
// ============================================================================
export interface TemporalFileData extends FileNode {
  commitHistory: Array<{
    date: Date;
    author: string;
    linesChanged: number;
  }>;
}

export function createTemporalRepository(): RepositoryData & {
  temporalData: Map<string, TemporalFileData>;
} {
  const baseRepo = createMediumRepository();

  const temporalData = new Map<string, TemporalFileData>();
  const authors = ['alice', 'bob', 'charlie', 'diana'];

  // Generate commit history for each file
  baseRepo.allFiles.forEach((file) => {
    const numCommits = Math.floor(Math.random() * 50) + 5;
    const commitHistory: TemporalFileData['commitHistory'] = [];

    // Generate commits over the past year (using fixed base date for consistency)
    const baseTime = new Date('2025-01-01').getTime();
    for (let i = 0; i < numCommits; i++) {
      const daysAgo = Math.floor(Math.random() * 365);
      commitHistory.push({
        date: new Date(baseTime - daysAgo * 24 * 60 * 60 * 1000),
        author: authors[Math.floor(Math.random() * authors.length)],
        linesChanged: Math.floor(Math.random() * 100) + 1,
      });
    }

    // Sort by date
    commitHistory.sort((a, b) => a.date.getTime() - b.date.getTime());

    temporalData.set(file.id, {
      ...file,
      commitHistory,
    });
  });

  return {
    ...baseRepo,
    name: 'temporal-repo',
    description: 'Repository with temporal/commit data',
    temporalData,
  };
}

// ============================================================================
// FIXTURE 6: Contributor-Heavy (for Constellation View)
// ============================================================================
export interface ContributorData {
  username: string;
  avatarUrl: string;
  commitCount: number;
  filesOwned: string[];
  joinedDate: Date;
}

export function createContributorRepository(): RepositoryData & {
  contributors: ContributorData[];
} {
  const baseRepo = createMediumRepository();

  const contributors: ContributorData[] = [
    {
      username: 'alice',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      commitCount: 450,
      filesOwned: [],
      joinedDate: new Date('2022-01-15'),
    },
    {
      username: 'bob',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      commitCount: 380,
      filesOwned: [],
      joinedDate: new Date('2022-03-20'),
    },
    {
      username: 'charlie',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
      commitCount: 220,
      filesOwned: [],
      joinedDate: new Date('2022-06-10'),
    },
    {
      username: 'diana',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana',
      commitCount: 180,
      filesOwned: [],
      joinedDate: new Date('2022-09-01'),
    },
    {
      username: 'eve',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve',
      commitCount: 95,
      filesOwned: [],
      joinedDate: new Date('2023-02-15'),
    },
  ];

  // Assign files to contributors
  baseRepo.allFiles.forEach((file) => {
    const ownerIndex = Math.floor(Math.random() * contributors.length);
    contributors[ownerIndex].filesOwned.push(file.id);
    file.author = contributors[ownerIndex].username;
  });

  return {
    ...baseRepo,
    name: 'contributor-repo',
    description: 'Repository with rich contributor data',
    contributors,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildDirectoryTree(files: FileNode[]): DirectoryNode {
  const root: DirectoryNode = {
    id: 'root',
    name: 'src',
    path: 'src',
    files: [],
    directories: [],
    totalLineCount: 0,
    fileCount: 0,
  };

  const dirMap = new Map<string, DirectoryNode>();
  dirMap.set('src', root);

  // Build directory structure
  files.forEach((file) => {
    const pathParts = file.path.split('/');
    const fileName = pathParts.pop()!;
    let currentPath = '';

    pathParts.forEach((part, index) => {
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!dirMap.has(currentPath)) {
        const newDir: DirectoryNode = {
          id: `dir-${currentPath}`,
          name: part,
          path: currentPath,
          files: [],
          directories: [],
          totalLineCount: 0,
          fileCount: 0,
        };
        dirMap.set(currentPath, newDir);

        // Add to parent
        const parent = dirMap.get(parentPath) || root;
        parent.directories.push(newDir);
      }
    });

    // Add file to its directory
    const fileDir = dirMap.get(pathParts.join('/')) || root;
    fileDir.files.push(file);
  });

  // Calculate totals
  function calculateTotals(dir: DirectoryNode): void {
    dir.directories.forEach(calculateTotals);
    dir.totalLineCount = dir.files.reduce((sum, f) => sum + f.lineCount, 0) +
      dir.directories.reduce((sum, d) => sum + d.totalLineCount, 0);
    dir.fileCount = dir.files.length +
      dir.directories.reduce((sum, d) => sum + d.fileCount, 0);
  }

  calculateTotals(root);
  return root;
}

function generateConnections(files: FileNode[], density: number): Connection[] {
  const connections: Connection[] = [];

  // Categorize files for realistic connection patterns
  const components = files.filter(f => f.name.match(/^[A-Z].*\.(tsx|jsx)$/) && !f.name.includes('.test'));
  const hooks = files.filter(f => f.name.startsWith('use') && !f.name.includes('.test'));
  const services = files.filter(f => f.name.includes('Service') && !f.name.includes('.test'));
  const utils = files.filter(f => f.path.includes('/utils/') && !f.name.includes('.test'));
  const tests = files.filter(f => f.name.includes('.test.') || f.name.includes('.spec.'));
  const coreFiles = files.filter(f => f.category === 'core' || f.category === 'legacy');

  // Helper to create a connection
  const addConnection = (
    sourceId: string,
    targetId: string,
    type: ConnectionType,
    metadata?: ConnectionMetadata
  ) => {
    const source = files.find(f => f.id === sourceId);
    const target = files.find(f => f.id === targetId);
    if (source && target) {
      connections.push({
        id: `c-${sourceId}-${targetId}`,
        sourceId,
        targetId,
        type,
        weight: Math.floor(Math.random() * 5) + 1,
        metadata,
      });
      if (!source.imports) source.imports = [];
      if (!target.importedBy) target.importedBy = [];
      source.imports.push(targetId);
      target.importedBy.push(sourceId);
    }
  };

  // Components → Hooks (call connections)
  components.forEach((component) => {
    const numHooks = Math.floor(Math.random() * 3) + 1;
    const selectedHooks = hooks
      .sort(() => Math.random() - 0.5)
      .slice(0, numHooks);

    selectedHooks.forEach((hook) => {
      addConnection(component.id, hook.id, 'call', {
        functionName: hook.name.replace('.ts', ''),
        isAsync: Math.random() > 0.5,
        lineNumber: Math.floor(Math.random() * 50) + 10,
      });
    });
  });

  // Hooks → Services (call connections)
  hooks.forEach((hook) => {
    if (Math.random() > 0.5 && services.length > 0) {
      const service = services[Math.floor(Math.random() * services.length)];
      addConnection(hook.id, service.id, 'call', {
        functionName: `${service.name.replace('Service.ts', '')}.fetch`,
        isAsync: true,
        lineNumber: Math.floor(Math.random() * 30) + 5,
      });
    }
  });

  // Services → Components (dataflow connections)
  services.forEach((service) => {
    const numConsumers = Math.floor(Math.random() * 3) + 1;
    const consumers = components
      .sort(() => Math.random() - 0.5)
      .slice(0, numConsumers);

    consumers.forEach((component) => {
      addConnection(service.id, component.id, 'dataflow', {
        variableName: 'data',
        variableType: `${service.name.replace('Service.ts', '')}Response`,
        lineNumber: Math.floor(Math.random() * 20) + 1,
      });
    });
  });

  // Components → Utils (import connections)
  components.forEach((component) => {
    if (Math.random() > 0.6 && utils.length > 0) {
      const util = utils[Math.floor(Math.random() * utils.length)];
      addConnection(component.id, util.id, 'import', {
        lineNumber: Math.floor(Math.random() * 10) + 1,
      });
    }
  });

  // Class inheritance patterns (extends)
  const serviceClasses = services.filter(s => Math.random() > 0.7);
  serviceClasses.forEach((service, index) => {
    if (index > 0) {
      addConnection(service.id, services[0].id, 'extends', {
        lineNumber: 5,
      });
    }
  });

  // Test → Source connections (call)
  tests.forEach((test) => {
    const sourceName = test.name.replace('.test.tsx', '.tsx').replace('.test.ts', '.ts').replace('.spec.tsx', '.tsx').replace('.spec.ts', '.ts');
    const sourceFile = files.find(f => f.name === sourceName);
    if (sourceFile) {
      addConnection(test.id, sourceFile.id, 'call', {
        functionName: sourceName.replace(/\.(ts|tsx)$/, ''),
        lineNumber: 1,
      });
    }
  });

  // General import connections for remaining core files
  coreFiles.forEach((file) => {
    const numImports = Math.floor(Math.random() * 3);
    const potentialImports = coreFiles.filter(
      f => f.id !== file.id &&
        f.category !== 'test' &&
        f.category !== 'docs' &&
        !connections.some(c => c.sourceId === file.id && c.targetId === f.id)
    );

    const shuffled = [...potentialImports].sort(() => Math.random() - 0.5);
    const imports = shuffled.slice(0, numImports);

    imports.forEach((importedFile) => {
      if (Math.random() < density * 10) {
        addConnection(file.id, importedFile.id, 'import', {
          lineNumber: Math.floor(Math.random() * 5) + 1,
        });
      }
    });
  });

  return connections;
}

function calculateStats(files: FileNode[]) {
  const languageBreakdown: Record<string, number> = {};
  files.forEach((file) => {
    languageBreakdown[file.extension] = (languageBreakdown[file.extension] || 0) + 1;
  });

  return {
    totalFiles: files.length,
    totalLines: files.reduce((sum, f) => sum + f.lineCount, 0),
    totalDirectories: new Set(files.map(f => f.path.split('/').slice(0, -1).join('/'))).size,
    languageBreakdown,
    avgComplexity: files.reduce((sum, f) => sum + f.complexity, 0) / files.length,
  };
}

// Export a fixture selector
export type FixtureType = 'small' | 'medium' | 'large' | 'edge-cases' | 'temporal' | 'contributor';

export function getFixture(type: FixtureType): RepositoryData {
  switch (type) {
    case 'small':
      return createSmallRepository();
    case 'medium':
      return createMediumRepository();
    case 'large':
      return createLargeRepository();
    case 'edge-cases':
      return createEdgeCasesRepository();
    case 'temporal':
      return createTemporalRepository();
    case 'contributor':
      return createContributorRepository();
    default:
      return createMediumRepository();
  }
}
