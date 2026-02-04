import { create } from 'zustand';
import { RepositoryData, CityData, BuildingData, ZoomLevel, BreadcrumbItem, ZOOM_LEVELS, ConnectionType, RoadData } from '@/types/repository';
import { FixtureType, getFixture } from '@/lib/mockData/fixtures';
import { repositoryToCityData, generateMockRepository } from '@/lib/mockData';
import { CriticalPathScore, calculateCriticalPath } from '@/lib/criticalPath';
import { generateInsights, type CodebaseInsights } from '@/lib/insightsEngine';
import { buildBuildingIndices } from '@/lib/buildingLookup';

// Git history types
export interface GitHistoryData {
  velocityData: Record<string, {
    velocityScore: number;
    changeCount: number;
    churnScore: number;
    lastChanged: string;
  }>;
  ownershipData: Record<string, {
    primaryOwner: string;
    busFactor: number;
    ownershipScore: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  contributors: Array<{
    login: string;
    avatar: string;
    contributions: number;
  }>;
  analyzedAt: string;
}

interface CameraTarget {
  position: [number, number, number];
  lookAt: [number, number, number];
}

export type { FixtureType };

interface VisualizationState {
  // Data
  repository: RepositoryData | null;
  cityData: CityData | null;
  currentFixture: FixtureType;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Selection & Hover
  selectedBuildingId: string | null;
  hoveredBuildingId: string | null;
  hoveredBuilding: BuildingData | null;

  // Camera
  cameraTarget: CameraTarget | null;
  isAnimatingCamera: boolean;
  cameraDistance: number;

  // Zoom & Navigation
  currentZoomLevel: ZoomLevel;
  breadcrumbs: BreadcrumbItem[];
  focusedClusterId: string | null;

  // View settings
  showConnections: boolean;
  showLabels: boolean;
  bloomIntensity: number;

  // Panel minimization state
  minimizedPanels: {
    zoomIndicator: boolean;
    selectedBuilding: boolean;
    controlPanel: boolean;
    legend: boolean;
  };

  // Code Editor State
  codeEditorOpen: boolean;
  codeEditorFileId: string | null;
  codeEditorPosition: { x: number; y: number };
  codeEditorSize: { width: number; height: number };

  // Connection Filters
  connectionFilters: {
    import: boolean;
    call: boolean;
    dataflow: boolean;
    extends: boolean;
    implements: boolean;
    directory: boolean;
  };

  // Connection Hover/Selection
  hoveredConnectionId: string | null;
  hoveredConnection: RoadData | null;
  selectedConnectionId: string | null;
  selectedConnection: RoadData | null;

  // Find Usages State
  findUsagesOpen: boolean;
  findUsagesFileId: string | null;
  findUsagesResults: Array<{
    fileId: string;
    fileName: string;
    filePath: string;
    category: string;
    connectionType: ConnectionType;
    direction: 'incoming' | 'outgoing'; // incoming = files that use this, outgoing = files this uses
    metadata?: {
      functionName?: string;
      variableName?: string;
      lineNumber?: number;
    };
  }>;
  highlightedFileIds: Set<string>; // Files to highlight in 3D view

  // Critical Path Radar State
  criticalPathEnabled: boolean;
  criticalFiles: CriticalPathScore[];
  criticalFileIds: Set<string>; // For quick lookup in Building component

  // Git History State
  gitHistoryData: GitHistoryData | null;
  gitHistoryLoading: boolean;
  gitHistoryError: string | null;

  // Building indices for O(1) lookups
  flatBuildings: BuildingData[];
  buildingIdToIndex: Map<string, number>;
  fileIdToBuildingIndex: Map<string, number>;

  // Insights Panel State
  insightsPanelOpen: boolean;
  codebaseInsights: CodebaseInsights | null;
  insightsHighlightedFileIds: Set<string>;

  // Code Copilot Chat State
  chatMessages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    codeContext?: {
      fileName: string;
      selectedCode?: string;
      lineRange?: [number, number];
    };
  }>;
  chatLoading: boolean;
  chatError: string | null;
  chatApiKey: string | null;
  chatModel: 'claude' | 'gpt-4';
  chatPanelOpen: boolean;
  selectedCode: string | null;
  selectedCodeRange: [number, number] | null;

  // Actions
  setRepository: (repo: RepositoryData) => void;
  setCityData: (city: CityData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  selectBuilding: (buildingId: string | null) => void;
  hoverBuilding: (buildingId: string | null, building: BuildingData | null) => void;
  setCameraTarget: (target: CameraTarget | null) => void;
  setIsAnimatingCamera: (animating: boolean) => void;
  setCameraDistance: (distance: number) => void;
  setZoomLevel: (level: ZoomLevel) => void;
  navigateTo: (item: BreadcrumbItem) => void;
  navigateToRoot: () => void;
  showDistrictView: () => void;
  focusCluster: (clusterId: string | null) => void;
  toggleConnections: () => void;
  toggleLabels: () => void;
  setBloomIntensity: (intensity: number) => void;
  resetCamera: () => void;
  loadFixture: (fixtureType: FixtureType) => void;
  loadFromSessionStorage: () => boolean; // Returns true if data was loaded
  loadRepoDirectly: (repo: RepositoryData, cityData: CityData) => void;
  togglePanelMinimized: (panel: 'zoomIndicator' | 'selectedBuilding' | 'controlPanel' | 'legend') => void;

  // Code Editor Actions
  openCodeEditor: (fileId: string) => void;
  closeCodeEditor: () => void;
  setCodeEditorPosition: (pos: { x: number; y: number }) => void;
  setCodeEditorSize: (size: { width: number; height: number }) => void;

  // Connection Filter Actions
  toggleConnectionFilter: (type: ConnectionType) => void;
  setAllConnectionFilters: (enabled: boolean) => void;

  // Connection Interaction Actions
  hoverConnection: (id: string | null, road: RoadData | null) => void;
  selectConnection: (id: string | null, road: RoadData | null) => void;

  // Find Usages Actions
  openFindUsages: (fileId: string) => void;
  closeFindUsages: () => void;
  highlightFiles: (fileIds: string[]) => void;
  clearHighlights: () => void;
  focusOnUsageFile: (fileId: string) => void;

  // Critical Path Radar Actions
  toggleCriticalPath: () => void;
  calculateCriticalPathScores: () => void;
  focusOnCriticalFile: (fileId: string) => void;

  // Insights Panel Actions
  toggleInsightsPanel: () => void;
  generateCodebaseInsights: () => void;
  showInsightInView: (fileIds: string[]) => void;
  clearInsightsHighlight: () => void;

  // Git History Actions
  loadGitHistory: (owner: string, name: string) => Promise<void>;
  clearGitHistory: () => void;

  // Code Copilot Chat Actions
  toggleChatPanel: () => void;
  sendChatMessage: (content: string) => Promise<void>;
  clearChatMessages: () => void;
  setChatApiKey: (key: string | null) => void;
  setChatModel: (model: 'claude' | 'gpt-4') => void;
  setSelectedCode: (code: string | null, range?: [number, number]) => void;
  addChatMessage: (message: { role: 'user' | 'assistant'; content: string; codeContext?: { fileName: string; selectedCode?: string } }) => void;
  setChatLoading: (loading: boolean) => void;
  setChatError: (error: string | null) => void;
}

// Helper to determine zoom level from camera distance
function getZoomLevelFromDistance(distance: number): ZoomLevel {
  for (const config of ZOOM_LEVELS) {
    if (distance >= config.minDistance && distance < config.maxDistance) {
      return config.level;
    }
  }
  return 'satellite';
}

export const useVisualizationStore = create<VisualizationState>((set, get) => ({
  // Initial state
  repository: null,
  cityData: null,
  currentFixture: 'medium',
  isLoading: true,
  error: null,
  selectedBuildingId: null,
  hoveredBuildingId: null,
  hoveredBuilding: null,
  cameraTarget: null,
  isAnimatingCamera: false,
  cameraDistance: 50,
  currentZoomLevel: 'regional',
  breadcrumbs: [],
  focusedClusterId: null,
  showConnections: true,
  showLabels: true,
  bloomIntensity: 1.5,
  minimizedPanels: {
    zoomIndicator: true,
    selectedBuilding: false,
    controlPanel: true,
    legend: true,
  },

  // Code Editor State
  codeEditorOpen: false,
  codeEditorFileId: null,
  codeEditorPosition: { x: 100, y: 80 },
  codeEditorSize: { width: 900, height: 650 },

  // Connection Filters
  connectionFilters: {
    import: true,
    call: true,
    dataflow: true,
    extends: true,
    implements: true,
    directory: true,
  },

  // Connection Hover/Selection
  hoveredConnectionId: null,
  hoveredConnection: null,
  selectedConnectionId: null,
  selectedConnection: null,

  // Find Usages State
  findUsagesOpen: false,
  findUsagesFileId: null,
  findUsagesResults: [],
  highlightedFileIds: new Set(),

  // Critical Path Radar State
  criticalPathEnabled: false,
  criticalFiles: [],
  criticalFileIds: new Set(),

  // Git History State
  gitHistoryData: null,
  gitHistoryLoading: false,
  gitHistoryError: null,

  // Building indices
  flatBuildings: [],
  buildingIdToIndex: new Map(),
  fileIdToBuildingIndex: new Map(),

  // Insights Panel State
  insightsPanelOpen: true,
  codebaseInsights: null,
  insightsHighlightedFileIds: new Set<string>(),

  // Code Copilot Chat State
  chatMessages: [],
  chatLoading: false,
  chatError: null,
  chatApiKey: typeof window !== 'undefined' ? localStorage.getItem('viz-wizard-api-key') : null,
  chatModel: 'claude',
  chatPanelOpen: true, // Default open when code editor is open
  selectedCode: null,
  selectedCodeRange: null,

  // Actions
  setRepository: (repo) => set({ repository: repo }),

  setCityData: (city) => set({ cityData: city, isLoading: false }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isLoading: false }),

  selectBuilding: (buildingId) => {
    // Clear insights highlight when manually selecting
    if (buildingId) get().clearInsightsHighlight();
    if (!buildingId) {
      set({ selectedBuildingId: null, cameraTarget: null });
      return;
    }

    const { flatBuildings, buildingIdToIndex } = get();
    const idx = buildingIdToIndex.get(buildingId);
    if (idx === undefined) return;

    const building = flatBuildings[idx];
    const [x, y, z] = building.position;
    const height = building.dimensions[1];

    set({
      selectedBuildingId: buildingId,
      cameraTarget: {
        position: [x + 10, height + 8, z + 10],
        lookAt: [x, height / 2, z],
      },
      isAnimatingCamera: true,
    });
  },

  hoverBuilding: (buildingId, building) => set({
    hoveredBuildingId: buildingId,
    hoveredBuilding: building,
  }),

  setCameraTarget: (target) => set({ cameraTarget: target }),

  setIsAnimatingCamera: (animating) => set({ isAnimatingCamera: animating }),

  setCameraDistance: (distance) => {
    const newZoomLevel = getZoomLevelFromDistance(distance);
    const { currentZoomLevel } = get();

    if (newZoomLevel !== currentZoomLevel) {
      set({ cameraDistance: distance, currentZoomLevel: newZoomLevel });
    } else {
      set({ cameraDistance: distance });
    }
  },

  setZoomLevel: (level) => set({ currentZoomLevel: level }),

  navigateTo: (item) => {
    const { breadcrumbs } = get();
    // Find if item already exists in breadcrumbs
    const existingIndex = breadcrumbs.findIndex(b => b.id === item.id);

    if (existingIndex >= 0) {
      // Navigate back to existing item
      set({
        breadcrumbs: breadcrumbs.slice(0, existingIndex + 1),
        focusedClusterId: item.id,
        cameraTarget: {
          position: [item.position[0] + 15, 20, item.position[2] + 15],
          lookAt: item.position,
        },
        isAnimatingCamera: true,
      });
    } else {
      // Add new breadcrumb
      set({
        breadcrumbs: [...breadcrumbs, item],
        focusedClusterId: item.id,
        cameraTarget: {
          position: [item.position[0] + 15, 20, item.position[2] + 15],
          lookAt: item.position,
        },
        isAnimatingCamera: true,
      });
    }
  },

  navigateToRoot: () => set({
    breadcrumbs: [],
    focusedClusterId: null,
    cameraTarget: {
      position: [30, 25, 30],
      lookAt: [0, 0, 0],
    },
    isAnimatingCamera: true,
    selectedBuildingId: null,
  }),

  showDistrictView: () => set({
    breadcrumbs: [],
    focusedClusterId: null,
    cameraTarget: {
      position: [0, 60, 0.1], // Top-down view from above
      lookAt: [0, 0, 0],
    },
    isAnimatingCamera: true,
    selectedBuildingId: null,
    currentZoomLevel: 'satellite',
  }),

  focusCluster: (clusterId) => set({ focusedClusterId: clusterId }),

  toggleConnections: () => set((state) => ({ showConnections: !state.showConnections })),

  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),

  setBloomIntensity: (intensity) => set({ bloomIntensity: intensity }),

  resetCamera: () => set({
    cameraTarget: {
      position: [30, 25, 30],
      lookAt: [0, 0, 0],
    },
    isAnimatingCamera: true,
    selectedBuildingId: null,
  }),

  togglePanelMinimized: (panel) => set((state) => ({
    minimizedPanels: {
      ...state.minimizedPanels,
      [panel]: !state.minimizedPanels[panel],
    },
  })),

  loadFixture: (fixtureType: FixtureType) => {
    console.log('[loadFixture] Starting load for:', fixtureType);
    set({ isLoading: true, selectedBuildingId: null, hoveredBuildingId: null, hoveredBuilding: null });

    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      try {
        console.log('[loadFixture] Getting fixture...');
        let repo: RepositoryData;

        // Try fixtures first, fall back to old mock data if it fails
        try {
          repo = getFixture(fixtureType);
        } catch (fixtureError) {
          console.warn('[loadFixture] Fixture failed, using fallback:', fixtureError);
          repo = generateMockRepository('acme-corp', 'viz-wizard');
        }

        console.log('[loadFixture] Got repo:', repo?.name, 'files:', repo?.allFiles?.length);
        const city = repositoryToCityData(repo);
        console.log('[loadFixture] Got city data, districts:', city?.districts?.length);
        const indices = buildBuildingIndices(city);
        set({
          currentFixture: fixtureType,
          repository: repo,
          cityData: city,
          flatBuildings: indices.flatBuildings,
          buildingIdToIndex: indices.buildingIdToIndex,
          fileIdToBuildingIndex: indices.fileIdToBuildingIndex,
          isLoading: false,
          cameraTarget: {
            position: [30, 25, 30],
            lookAt: [0, 0, 0],
          },
          isAnimatingCamera: true,
        });
        console.log('[loadFixture] Success! isLoading set to false');
        // Generate insights after city renders
        setTimeout(() => get().generateCodebaseInsights(), 200);
      } catch (error) {
        console.error('[loadFixture] Error:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to load fixture',
          isLoading: false,
        });
      }
    }, 100);
  },

  loadFromSessionStorage: () => {
    if (typeof window === 'undefined') return false;

    try {
      const storedData = sessionStorage.getItem('viz-wizard-repo');
      const dataSource = sessionStorage.getItem('viz-wizard-repo-source');

      if (!storedData || dataSource !== 'github') {
        console.log('[loadFromSessionStorage] No GitHub repo data in sessionStorage');
        return false;
      }

      console.log('[loadFromSessionStorage] Found GitHub repo data, loading...');
      const repo: RepositoryData = JSON.parse(storedData);

      set({ isLoading: true, selectedBuildingId: null, hoveredBuildingId: null, hoveredBuilding: null });

      // Use setTimeout to allow UI to update before heavy computation
      setTimeout(() => {
        try {
          console.log('[loadFromSessionStorage] Processing repo:', repo.name, 'files:', repo.allFiles?.length);
          const city = repositoryToCityData(repo);
          console.log('[loadFromSessionStorage] City generated, districts:', city?.districts?.length);
          const indices = buildBuildingIndices(city);

          set({
            repository: repo,
            cityData: city,
            flatBuildings: indices.flatBuildings,
            buildingIdToIndex: indices.buildingIdToIndex,
            fileIdToBuildingIndex: indices.fileIdToBuildingIndex,
            isLoading: false,
            cameraTarget: {
              position: [30, 25, 30],
              lookAt: [0, 0, 0],
            },
            isAnimatingCamera: true,
          });

          // Clear sessionStorage after successful load
          sessionStorage.removeItem('viz-wizard-repo');
          sessionStorage.removeItem('viz-wizard-repo-source');

          console.log('[loadFromSessionStorage] Success!');
          // Generate insights after city renders
          setTimeout(() => get().generateCodebaseInsights(), 200);
        } catch (error) {
          console.error('[loadFromSessionStorage] Error processing data:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load repository data',
            isLoading: false,
          });
        }
      }, 100);

      return true;
    } catch (error) {
      console.error('[loadFromSessionStorage] Error:', error);
      return false;
    }
  },

  loadRepoDirectly: (repo: RepositoryData, city: CityData) => {
    const indices = buildBuildingIndices(city);
    set({
      repository: repo,
      cityData: city,
      flatBuildings: indices.flatBuildings,
      buildingIdToIndex: indices.buildingIdToIndex,
      fileIdToBuildingIndex: indices.fileIdToBuildingIndex,
      isLoading: false,
      selectedBuildingId: null,
      hoveredBuildingId: null,
      hoveredBuilding: null,
      cameraTarget: {
        position: [30, 25, 30],
        lookAt: [0, 0, 0],
      },
      isAnimatingCamera: true,
    });
    // Generate insights after render
    setTimeout(() => get().generateCodebaseInsights(), 200);
  },

  // Code Editor Actions
  openCodeEditor: (fileId: string) => set({
    codeEditorOpen: true,
    codeEditorFileId: fileId,
  }),

  closeCodeEditor: () => set({
    codeEditorOpen: false,
    codeEditorFileId: null,
  }),

  setCodeEditorPosition: (pos: { x: number; y: number }) => set({
    codeEditorPosition: pos,
  }),

  setCodeEditorSize: (size: { width: number; height: number }) => set({
    codeEditorSize: size,
  }),

  // Connection Filter Actions
  toggleConnectionFilter: (type: ConnectionType) => set((state) => ({
    connectionFilters: {
      ...state.connectionFilters,
      [type]: !state.connectionFilters[type as keyof typeof state.connectionFilters],
    },
  })),

  setAllConnectionFilters: (enabled: boolean) => set({
    connectionFilters: {
      import: enabled,
      call: enabled,
      dataflow: enabled,
      extends: enabled,
      implements: enabled,
      directory: enabled,
    },
  }),

  // Connection Interaction Actions
  hoverConnection: (id: string | null, road: RoadData | null) => set({
    hoveredConnectionId: id,
    hoveredConnection: road,
  }),

  selectConnection: (id: string | null, road: RoadData | null) => set({
    selectedConnectionId: id,
    selectedConnection: road,
  }),

  // Find Usages Actions
  openFindUsages: (fileId: string) => {
    get().clearInsightsHighlight();
    const { repository, cityData } = get();
    if (!repository || !cityData) return;

    // Find all connections where this file is involved
    const results: VisualizationState['findUsagesResults'] = [];
    const highlightedIds: string[] = [fileId]; // Include the source file

    // Get connections from the repository
    const connections = repository.connections || [];

    for (const conn of connections) {
      // Skip directory connections - they're not "usages"
      if (conn.type === 'directory') continue;

      if (conn.sourceId === fileId) {
        // Outgoing: this file uses other files
        const targetFile = repository.allFiles.find(f => f.id === conn.targetId);
        if (targetFile) {
          results.push({
            fileId: conn.targetId,
            fileName: targetFile.name,
            filePath: targetFile.path,
            category: targetFile.category,
            connectionType: conn.type,
            direction: 'outgoing',
            metadata: conn.metadata,
          });
          highlightedIds.push(conn.targetId);
        }
      } else if (conn.targetId === fileId) {
        // Incoming: other files use this file
        const sourceFile = repository.allFiles.find(f => f.id === conn.sourceId);
        if (sourceFile) {
          results.push({
            fileId: conn.sourceId,
            fileName: sourceFile.name,
            filePath: sourceFile.path,
            category: sourceFile.category,
            connectionType: conn.type,
            direction: 'incoming',
            metadata: conn.metadata,
          });
          highlightedIds.push(conn.sourceId);
        }
      }
    }

    // Sort results: incoming first, then by connection type
    results.sort((a, b) => {
      if (a.direction !== b.direction) {
        return a.direction === 'incoming' ? -1 : 1;
      }
      return a.connectionType.localeCompare(b.connectionType);
    });

    set({
      findUsagesOpen: true,
      findUsagesFileId: fileId,
      findUsagesResults: results,
      highlightedFileIds: new Set(highlightedIds),
    });
  },

  closeFindUsages: () => set({
    findUsagesOpen: false,
    findUsagesFileId: null,
    findUsagesResults: [],
    highlightedFileIds: new Set(),
  }),

  highlightFiles: (fileIds: string[]) => set({
    highlightedFileIds: new Set(fileIds),
  }),

  clearHighlights: () => set({
    highlightedFileIds: new Set(),
  }),

  focusOnUsageFile: (fileId: string) => {
    const { flatBuildings, fileIdToBuildingIndex } = get();
    const idx = fileIdToBuildingIndex.get(fileId);
    if (idx === undefined) return;

    const building = flatBuildings[idx];
    const [x, y, z] = building.position;
    const height = building.dimensions[1];

    set({
      selectedBuildingId: building.id,
      cameraTarget: {
        position: [x + 10, height + 8, z + 10],
        lookAt: [x, height / 2, z],
      },
      isAnimatingCamera: true,
    });
  },

  // Critical Path Radar Actions
  toggleCriticalPath: () => {
    get().clearInsightsHighlight();
    const { criticalPathEnabled, criticalFiles, repository } = get();

    if (!criticalPathEnabled) {
      // Turning ON - calculate scores if not already done
      if (criticalFiles.length === 0 && repository) {
        const scores = calculateCriticalPath(
          repository.allFiles,
          repository.connections,
          10 // Top 10 critical files
        );
        const criticalIds = new Set(scores.map(s => s.fileId));
        set({
          criticalPathEnabled: true,
          criticalFiles: scores,
          criticalFileIds: criticalIds,
          // Close other panels that might conflict
          findUsagesOpen: false,
          findUsagesResults: [],
          highlightedFileIds: new Set(),
        });
      } else {
        set({
          criticalPathEnabled: true,
          findUsagesOpen: false,
          findUsagesResults: [],
          highlightedFileIds: new Set(),
        });
      }
    } else {
      // Turning OFF
      set({
        criticalPathEnabled: false,
      });
    }
  },

  calculateCriticalPathScores: () => {
    const { repository } = get();
    if (!repository) return;

    const scores = calculateCriticalPath(
      repository.allFiles,
      repository.connections,
      10 // Top 10 critical files
    );
    const criticalIds = new Set(scores.map(s => s.fileId));

    set({
      criticalFiles: scores,
      criticalFileIds: criticalIds,
    });
  },

  focusOnCriticalFile: (fileId: string) => {
    const { flatBuildings, fileIdToBuildingIndex } = get();
    const idx = fileIdToBuildingIndex.get(fileId);
    if (idx === undefined) return;

    const building = flatBuildings[idx];
    const [x, y, z] = building.position;
    const height = building.dimensions[1];

    set({
      selectedBuildingId: building.id,
      cameraTarget: {
        position: [x + 10, height + 8, z + 10],
        lookAt: [x, height / 2, z],
      },
      isAnimatingCamera: true,
    });
  },

  // Insights Panel Actions
  toggleInsightsPanel: () => set((state) => ({ insightsPanelOpen: !state.insightsPanelOpen })),

  generateCodebaseInsights: () => {
    const { repository, gitHistoryData } = get();
    if (!repository) return;
    const insights = generateInsights(repository, gitHistoryData);
    set({ codebaseInsights: insights, insightsPanelOpen: true });
  },

  showInsightInView: (fileIds: string[]) => {
    const { flatBuildings, fileIdToBuildingIndex, insightsHighlightedFileIds } = get();
    if (fileIds.length === 0) return;

    // Toggle off if same files are already highlighted
    const currentIds = [...insightsHighlightedFileIds];
    if (currentIds.length === fileIds.length && fileIds.every(id => insightsHighlightedFileIds.has(id))) {
      set({ insightsHighlightedFileIds: new Set<string>() });
      return;
    }

    set({ insightsHighlightedFileIds: new Set(fileIds) });

    // Find building positions for camera targeting (O(1) per file via index)
    const positions: [number, number, number][] = [];
    for (const fid of fileIds) {
      const idx = fileIdToBuildingIndex.get(fid);
      if (idx !== undefined) {
        positions.push(flatBuildings[idx].position);
      }
    }

    if (positions.length === 0) return;

    const avgX = positions.reduce((s, p) => s + p[0], 0) / positions.length;
    const avgY = positions.reduce((s, p) => s + p[1], 0) / positions.length;
    const avgZ = positions.reduce((s, p) => s + p[2], 0) / positions.length;

    const spread = positions.length > 1
      ? Math.max(...positions.map(p => Math.sqrt((p[0] - avgX) ** 2 + (p[2] - avgZ) ** 2))) + 10
      : 12;

    set({
      cameraTarget: {
        position: [avgX + spread * 0.6, avgY + spread * 0.8, avgZ + spread * 0.6],
        lookAt: [avgX, avgY, avgZ],
      },
      isAnimatingCamera: true,
      // Clear building selection to avoid conflicts with insight highlighting
      selectedBuildingId: null,
    });
  },

  clearInsightsHighlight: () => set({ insightsHighlightedFileIds: new Set<string>() }),

  // Git History Actions
  loadGitHistory: async (owner: string, name: string) => {
    set({ gitHistoryLoading: true, gitHistoryError: null });

    try {
      const response = await fetch(`/api/repo/${owner}/${name}/history?days=90&maxCommits=100`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load git history');
      }

      const data = await response.json();

      set({
        gitHistoryData: {
          velocityData: data.velocityData,
          ownershipData: data.ownershipData,
          contributors: data.contributors,
          analyzedAt: data.analyzedAt,
        },
        gitHistoryLoading: false,
      });

      // Re-generate insights with bus factor data
      get().generateCodebaseInsights();

      // Recalculate critical path with velocity data
      const { repository, criticalPathEnabled } = get();
      if (repository && criticalPathEnabled) {
        // Update critical path scores with real velocity data
        const velocityMap = new Map(
          Object.entries(data.velocityData).map(([path, v]: [string, any]) => [
            path,
            v.velocityScore,
          ])
        );

        const scores = calculateCriticalPath(
          repository.allFiles,
          repository.connections,
          10,
          velocityMap
        );
        const criticalIds = new Set(scores.map(s => s.fileId));

        set({
          criticalFiles: scores,
          criticalFileIds: criticalIds,
        });
      }
    } catch (error) {
      set({
        gitHistoryError: error instanceof Error ? error.message : 'Failed to load git history',
        gitHistoryLoading: false,
      });
    }
  },

  clearGitHistory: () => {
    set({
      gitHistoryData: null,
      gitHistoryError: null,
    });
  },

  // Code Copilot Chat Actions
  toggleChatPanel: () => set((state) => ({ chatPanelOpen: !state.chatPanelOpen })),

  sendChatMessage: async (content: string) => {
    const { chatApiKey, chatModel, codeEditorFileId, repository, selectedCode, chatMessages } = get();

    if (!chatApiKey) {
      set({ chatError: 'Please set your API key in settings' });
      return;
    }

    // Find the current file
    const currentFile = repository?.allFiles.find(f => f.id === codeEditorFileId);
    if (!currentFile) {
      set({ chatError: 'No file selected' });
      return;
    }

    // Add user message
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content,
      timestamp: Date.now(),
      codeContext: selectedCode ? {
        fileName: currentFile.name,
        selectedCode,
      } : undefined,
    };

    set({
      chatMessages: [...chatMessages, userMessage],
      chatLoading: true,
      chatError: null,
    });

    try {
      // Build the system prompt
      const systemPrompt = `You are a code assistant embedded in Viz-Wizard, a codebase visualization tool.

You are currently viewing: ${currentFile.name}
Language: ${currentFile.language || 'typescript'}
File path: ${currentFile.path}

The user may ask you to:
- Explain what code does
- Identify potential bugs or issues
- Suggest improvements
- Explain how this code connects to other parts of the codebase

Be concise but thorough. Use code examples when helpful.
${selectedCode ? `The user has selected this code:\n\`\`\`\n${selectedCode}\n\`\`\`` : ''}

Current file content:
\`\`\`${currentFile.language || 'typescript'}
${currentFile.content || '// Content not available'}
\`\`\``;

      // Call the appropriate API
      let assistantContent: string;

      if (chatModel === 'claude') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': chatApiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
              ...chatMessages.filter(m => m.role !== 'system').map(m => ({
                role: m.role,
                content: m.content,
              })),
              { role: 'user', content },
            ],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        assistantContent = data.content[0]?.text || 'No response received';
      } else {
        // OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${chatApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            messages: [
              { role: 'system', content: systemPrompt },
              ...chatMessages.filter(m => m.role !== 'system').map(m => ({
                role: m.role,
                content: m.content,
              })),
              { role: 'user', content },
            ],
            max_tokens: 1024,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        assistantContent = data.choices[0]?.message?.content || 'No response received';
      }

      // Add assistant message
      const assistantMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant' as const,
        content: assistantContent,
        timestamp: Date.now(),
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, assistantMessage],
        chatLoading: false,
      }));
    } catch (error) {
      set({
        chatError: error instanceof Error ? error.message : 'Failed to send message',
        chatLoading: false,
      });
    }
  },

  clearChatMessages: () => set({ chatMessages: [], chatError: null }),

  setChatApiKey: (key: string | null) => {
    if (typeof window !== 'undefined') {
      if (key) {
        localStorage.setItem('viz-wizard-api-key', key);
      } else {
        localStorage.removeItem('viz-wizard-api-key');
      }
    }
    set({ chatApiKey: key, chatError: null });
  },

  setChatModel: (model: 'claude' | 'gpt-4') => set({ chatModel: model }),

  setSelectedCode: (code: string | null, range?: [number, number]) => set({
    selectedCode: code,
    selectedCodeRange: range || null,
  }),

  addChatMessage: (message) => {
    const { chatMessages, codeEditorFileId, repository } = get();
    const currentFile = repository?.allFiles.find(f => f.id === codeEditorFileId);

    set({
      chatMessages: [
        ...chatMessages,
        {
          id: `msg-${Date.now()}`,
          role: message.role,
          content: message.content,
          timestamp: Date.now(),
          codeContext: message.codeContext || (currentFile ? { fileName: currentFile.name } : undefined),
        },
      ],
    });
  },

  setChatLoading: (loading: boolean) => set({ chatLoading: loading }),

  setChatError: (error: string | null) => set({ chatError: error }),
}));
