/**
 * Clustering utilities for hierarchical zoom visualization
 * Groups buildings into clusters at different zoom levels
 */

import { CityData, DistrictData, BuildingData, ClusterData, FileCategory } from '@/types/repository';

// Category colors for clusters
const CATEGORY_COLORS: Record<FileCategory, string> = {
  core: '#00ffff',    // Cyan
  legacy: '#ffaa00',  // Amber
  style: '#aa44ff',   // Purple
  test: '#44ff88',    // Green
  config: '#888899',  // Gray
  docs: '#ffffff',    // White
};

/**
 * Generate regional clusters (groups of districts)
 * Used at regional zoom level
 */
export function generateRegionalClusters(cityData: CityData): ClusterData[] {
  const clusters: ClusterData[] = [];

  // Group districts by their position (quadrants)
  const quadrants: Map<string, DistrictData[]> = new Map();

  cityData.districts.forEach(district => {
    const quadX = Math.floor(district.position[0] / 20);
    const quadZ = Math.floor(district.position[2] / 20);
    const key = `${quadX},${quadZ}`;

    if (!quadrants.has(key)) {
      quadrants.set(key, []);
    }
    quadrants.get(key)!.push(district);
  });

  // Create cluster for each quadrant
  let clusterIndex = 0;
  quadrants.forEach((districts, key) => {
    if (districts.length === 0) return;

    // Calculate cluster center
    const centerX = districts.reduce((sum, d) => sum + d.position[0], 0) / districts.length;
    const centerZ = districts.reduce((sum, d) => sum + d.position[2], 0) / districts.length;

    // Aggregate stats
    const allBuildings = districts.flatMap(d => d.buildings);
    const fileCount = allBuildings.length;
    const totalLines = allBuildings.reduce((sum, b) => sum + b.metadata.lineCount, 0);
    const avgComplexity = allBuildings.length > 0
      ? allBuildings.reduce((sum, b) => sum + b.metadata.complexity, 0) / allBuildings.length
      : 0;

    // Find dominant category
    const categoryCounts = new Map<FileCategory, number>();
    allBuildings.forEach(b => {
      const count = categoryCounts.get(b.metadata.category) || 0;
      categoryCounts.set(b.metadata.category, count + 1);
    });
    let dominantCategory: FileCategory = 'core';
    let maxCount = 0;
    categoryCounts.forEach((count, category) => {
      if (count > maxCount) {
        maxCount = count;
        dominantCategory = category;
      }
    });

    // Calculate radius based on content
    const radius = Math.max(3, Math.min(10, Math.sqrt(fileCount) * 1.5));

    clusters.push({
      id: `regional-cluster-${clusterIndex++}`,
      name: districts.length === 1 ? districts[0].name : `${districts[0].name} +${districts.length - 1}`,
      path: districts.map(d => d.name).join(', '),
      position: [centerX, radius / 2, centerZ],
      radius,
      fileCount,
      totalLines,
      avgComplexity,
      dominantCategory,
      color: CATEGORY_COLORS[dominantCategory],
      children: districts.map(d => d.id),
    });
  });

  return clusters;
}

/**
 * Generate satellite clusters (high-level module groups)
 * Used at satellite zoom level
 */
export function generateSatelliteClusters(cityData: CityData): ClusterData[] {
  // At satellite level, we show one cluster per major module/package
  const allBuildings = cityData.districts.flatMap(d => d.buildings);

  // Group by top-level path segment
  const moduleGroups: Map<string, BuildingData[]> = new Map();

  allBuildings.forEach(building => {
    const pathParts = building.metadata.path.split('/');
    const topLevel = pathParts.length > 1 ? pathParts[0] : 'root';

    if (!moduleGroups.has(topLevel)) {
      moduleGroups.set(topLevel, []);
    }
    moduleGroups.get(topLevel)!.push(building);
  });

  const clusters: ClusterData[] = [];
  let clusterIndex = 0;
  const angleStep = (2 * Math.PI) / Math.max(moduleGroups.size, 1);

  moduleGroups.forEach((buildings, moduleName) => {
    // Position clusters in a circle
    const angle = clusterIndex * angleStep;
    const distance = 15;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    const fileCount = buildings.length;
    const totalLines = buildings.reduce((sum, b) => sum + b.metadata.lineCount, 0);
    const avgComplexity = buildings.reduce((sum, b) => sum + b.metadata.complexity, 0) / Math.max(buildings.length, 1);

    // Find dominant category
    const categoryCounts = new Map<FileCategory, number>();
    buildings.forEach(b => {
      const count = categoryCounts.get(b.metadata.category) || 0;
      categoryCounts.set(b.metadata.category, count + 1);
    });
    let dominantCategory: FileCategory = 'core';
    let maxCount = 0;
    categoryCounts.forEach((count, category) => {
      if (count > maxCount) {
        maxCount = count;
        dominantCategory = category;
      }
    });

    const radius = Math.max(4, Math.min(12, Math.sqrt(fileCount) * 2));

    clusters.push({
      id: `satellite-cluster-${clusterIndex}`,
      name: moduleName,
      path: moduleName,
      position: [x, radius / 2, z],
      radius,
      fileCount,
      totalLines,
      avgComplexity,
      dominantCategory,
      color: CATEGORY_COLORS[dominantCategory],
      children: buildings.map(b => b.id),
    });

    clusterIndex++;
  });

  return clusters;
}

/**
 * Generate district clusters from buildings
 * Used to simplify district view when there are many buildings
 */
export function generateDistrictClusters(district: DistrictData): ClusterData[] {
  const buildings = district.buildings;

  // If few buildings, don't cluster
  if (buildings.length <= 10) {
    return [];
  }

  // Group buildings by category
  const categoryGroups: Map<FileCategory, BuildingData[]> = new Map();

  buildings.forEach(building => {
    const category = building.metadata.category;
    if (!categoryGroups.has(category)) {
      categoryGroups.set(category, []);
    }
    categoryGroups.get(category)!.push(building);
  });

  const clusters: ClusterData[] = [];

  categoryGroups.forEach((categoryBuildings, category) => {
    if (categoryBuildings.length < 3) return; // Don't cluster tiny groups

    // Calculate cluster center
    const centerX = categoryBuildings.reduce((sum, b) => sum + b.position[0], 0) / categoryBuildings.length;
    const centerZ = categoryBuildings.reduce((sum, b) => sum + b.position[2], 0) / categoryBuildings.length;

    const fileCount = categoryBuildings.length;
    const totalLines = categoryBuildings.reduce((sum, b) => sum + b.metadata.lineCount, 0);
    const avgComplexity = categoryBuildings.reduce((sum, b) => sum + b.metadata.complexity, 0) / categoryBuildings.length;

    const radius = Math.max(2, Math.min(6, Math.sqrt(fileCount)));

    clusters.push({
      id: `district-cluster-${district.id}-${category}`,
      name: `${category} files`,
      path: district.name,
      position: [centerX, radius / 2, centerZ],
      radius,
      fileCount,
      totalLines,
      avgComplexity,
      dominantCategory: category,
      color: CATEGORY_COLORS[category],
      children: categoryBuildings.map(b => b.id),
    });
  });

  return clusters;
}
