'use client';

import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { DistrictData } from '@/types/repository';
import { Building } from './Building';
import { SimplifiedBuilding } from './SimplifiedBuilding';
import { useVisualizationStore } from '@/stores/visualizationStore';

interface DistrictProps {
  data: DistrictData;
  simplified?: boolean;
}

export function District({ data, simplified = false }: DistrictProps) {
  const { showLabels } = useVisualizationStore();

  // Calculate district dimensions
  const districtWidth = data.bounds.maxX - data.bounds.minX;
  const districtDepth = data.bounds.maxZ - data.bounds.minZ;
  const centerX = (data.bounds.minX + data.bounds.maxX) / 2;
  const centerZ = (data.bounds.minZ + data.bounds.maxZ) / 2;

  // Ground plane material
  const groundMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#0a0a12',
      metalness: 0.8,
      roughness: 0.6,
      transparent: true,
      opacity: simplified ? 0.6 : 0.8,
    });
  }, [simplified]);

  return (
    <group position={[0, 0, 0]}>
      {/* District ground plane */}
      <mesh
        position={[centerX, -0.05, centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[districtWidth + 4, districtDepth + 4]} />
        <primitive object={groundMaterial} />
      </mesh>

      {/* District border glow */}
      <mesh
        position={[centerX, 0.01, centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[
          Math.max(districtWidth, districtDepth) / 2 + 1,
          Math.max(districtWidth, districtDepth) / 2 + 1.5,
          64
        ]} />
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* District label */}
      {showLabels && (
        <Text
          position={[centerX, 0.5, data.bounds.minZ - 2]}
          fontSize={simplified ? 1.5 : 1.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {data.name}
        </Text>
      )}

      {/* File count badge for simplified view */}
      {simplified && showLabels && (
        <Text
          position={[centerX, 0.3, data.bounds.minZ - 3.5]}
          fontSize={0.8}
          color="#888888"
          anchorX="center"
          anchorY="middle"
        >
          {data.buildings.length} files
        </Text>
      )}

      {/* Buildings - use simplified version at district zoom level */}
      {simplified ? (
        data.buildings.map((building) => (
          <SimplifiedBuilding key={building.id} data={building} />
        ))
      ) : (
        data.buildings.map((building) => (
          <Building key={building.id} data={building} />
        ))
      )}
    </group>
  );
}
