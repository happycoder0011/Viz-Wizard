'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { CityData } from '@/types/repository';
import { District } from './District';
import { Connections } from './Connections';
import { useVisualizationStore } from '@/stores/visualizationStore';

interface CityProps {
  data: CityData;
}

export function City({ data }: CityProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { showConnections } = useVisualizationStore();

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

      {showConnections && <Connections roads={data.roads} />}
      {data.districts.map((district) => (
        <District key={district.id} data={district} />
      ))}
    </group>
  );
}
