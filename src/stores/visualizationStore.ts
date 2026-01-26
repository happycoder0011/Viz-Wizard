import { create } from 'zustand';
import { RepositoryData, CityData, BuildingData, ZoomLevel, BreadcrumbItem, ZOOM_LEVELS, ConnectionType, RoadData } from '@/types/repository';
import { FixtureType, getFixture } from '@/lib/mockData/fixtures';
import { repositoryToCityData, generateMockRepository } from '@/lib/mockData';

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
  focusCluster: (clusterId: string | null) => void;
  toggleConnections: () => void;
  toggleLabels: () => void;
  setBloomIntensity: (intensity: number) => void;
  resetCamera: () => void;
  loadFixture: (fixtureType: FixtureType) => void;
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
    zoomIndicator: false,
    selectedBuilding: false,
    controlPanel: false,
    legend: false,
  },

  // Code Editor State
  codeEditorOpen: false,
  codeEditorFileId: null,
  codeEditorPosition: { x: 100, y: 80 },
  codeEditorSize: { width: 500, height: 600 },

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

  // Actions
  setRepository: (repo) => set({ repository: repo }),

  setCityData: (city) => set({ cityData: city, isLoading: false }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isLoading: false }),

  selectBuilding: (buildingId) => {
    const { cityData } = get();
    if (!cityData || !buildingId) {
      set({ selectedBuildingId: null, cameraTarget: null });
      return;
    }

    // Find the building
    let selectedBuilding: BuildingData | null = null;
    for (const district of cityData.districts) {
      const building = district.buildings.find(b => b.id === buildingId);
      if (building) {
        selectedBuilding = building;
        break;
      }
    }

    if (selectedBuilding) {
      const [x, y, z] = selectedBuilding.position;
      const height = selectedBuilding.dimensions[1];

      set({
        selectedBuildingId: buildingId,
        cameraTarget: {
          position: [x + 10, height + 8, z + 10],
          lookAt: [x, height / 2, z],
        },
        isAnimatingCamera: true,
      });
    }
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
        set({
          currentFixture: fixtureType,
          repository: repo,
          cityData: city,
          isLoading: false,
          cameraTarget: {
            position: [30, 25, 30],
            lookAt: [0, 0, 0],
          },
          isAnimatingCamera: true,
        });
        console.log('[loadFixture] Success! isLoading set to false');
      } catch (error) {
        console.error('[loadFixture] Error:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to load fixture',
          isLoading: false,
        });
      }
    }, 100);
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
}));
