'use client';

import { useRef, useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { CityData } from '@/types/repository';
import { InstancedBuildings } from './InstancedBuildings';
import { BatchedConnections } from './BatchedConnections';
import { useVisualizationStore } from '@/stores/visualizationStore';

interface CityProps {
  data: CityData;
}

// Shared materials for district ground planes
const districtGroundMat = new THREE.MeshStandardMaterial({
  color: '#0a0a12',
  metalness: 0.8,
  roughness: 0.6,
  transparent: true,
  opacity: 0.8,
});

const districtRingMat = new THREE.MeshBasicMaterial({
  color: '#00ffff',
  transparent: true,
  opacity: 0.15,
});

export function City({ data }: CityProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { showConnections, showLabels } = useVisualizationStore();

  // Flatten all buildings from all districts
  const flatBuildings = useMemo(() => {
    const result = [];
    for (const district of data.districts) {
      for (const building of district.buildings) {
        result.push(building);
      }
    }
    return result;
  }, [data.districts]);

  // Create ground grid
  const gridHelper = useMemo(() => {
    const size = Math.max(data.bounds.width, data.bounds.depth) + 40;
    const divisions = Math.floor(size / 5);

    return (
      <gridHelper
        args={[size, divisions, '#1a1a2e', '#0d0d14']}
        position={[0, 0, 0]}
      />
    );
  }, [data.bounds]);

  // Ground plane
  const groundPlane = useMemo(() => {
    return (
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
        receiveShadow
      >
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial
          color="#050508"
          metalness={0.9}
          roughness={0.8}
        />
      </mesh>
    );
  }, []);

  return (
    <group ref={groupRef}>
      {groundPlane}
      {gridHelper}

      {showConnections && <BatchedConnections roads={data.roads} />}

      {/* Instanced buildings — single draw call for all buildings */}
      <InstancedBuildings buildings={flatBuildings} />

      {/* District ground planes and labels (cheap — one per directory) */}
      {data.districts.map((district) => {
        const w = district.bounds.maxX - district.bounds.minX;
        const d = district.bounds.maxZ - district.bounds.minZ;
        const cx = (district.bounds.minX + district.bounds.maxX) / 2;
        const cz = (district.bounds.minZ + district.bounds.maxZ) / 2;
        const r = Math.max(w, d) / 2;

        return (
          <group key={district.id}>
            <mesh
              position={[cx, -0.05, cz]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
              material={districtGroundMat}
            >
              <planeGeometry args={[w + 4, d + 4]} />
            </mesh>
            <mesh
              position={[cx, 0.01, cz]}
              rotation={[-Math.PI / 2, 0, 0]}
              material={districtRingMat}
            >
              <ringGeometry args={[r + 1, r + 1.5, 64]} />
            </mesh>
            {showLabels && (
              <Text
                position={[cx, 0.5, district.bounds.minZ - 2]}
                fontSize={1.2}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.05}
                outlineColor="#000000"
              >
                {district.name}
              </Text>
            )}
          </group>
        );
      })}
    </group>
  );
}
