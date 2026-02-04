import { CityData, BuildingData } from '@/types/repository';

export interface BuildingIndices {
  flatBuildings: BuildingData[];
  buildingIdToIndex: Map<string, number>;
  fileIdToBuildingIndex: Map<string, number>;
}

export function buildBuildingIndices(cityData: CityData): BuildingIndices {
  const flatBuildings: BuildingData[] = [];
  const buildingIdToIndex = new Map<string, number>();
  const fileIdToBuildingIndex = new Map<string, number>();

  for (const district of cityData.districts) {
    for (const building of district.buildings) {
      const idx = flatBuildings.length;
      flatBuildings.push(building);
      buildingIdToIndex.set(building.id, idx);
      fileIdToBuildingIndex.set(building.fileId, idx);
    }
  }

  return { flatBuildings, buildingIdToIndex, fileIdToBuildingIndex };
}
