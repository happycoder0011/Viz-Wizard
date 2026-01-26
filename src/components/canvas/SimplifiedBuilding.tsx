'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BuildingData } from '@/types/repository';
import { useVisualizationStore } from '@/stores/visualizationStore';

interface SimplifiedBuildingProps {
  data: BuildingData;
}

/**
 * Simplified building component for district zoom level.
 * Renders a basic box without detailed interactions.
 * Optimized for performance when many buildings are visible.
 */
export function SimplifiedBuilding({ data }: SimplifiedBuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { selectedBuildingId, selectBuilding } = useVisualizationStore();

  const isSelected = selectedBuildingId === data.id;

  // Simplified material - no hover state
  const material = useMemo(() => {
    const baseColor = new THREE.Color(data.color);
    const emissiveColor = new THREE.Color(data.emissiveColor);

    return new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: emissiveColor,
      emissiveIntensity: isSelected ? data.emissiveIntensity * 2 : data.emissiveIntensity * 0.5,
      metalness: 0.4,
      roughness: 0.5,
    });
  }, [data.color, data.emissiveColor, data.emissiveIntensity, isSelected]);

  // Minimal animation for selected state
  useFrame(() => {
    if (!meshRef.current) return;
    const targetScale = isSelected ? 1.1 : 1;
    const currentScale = meshRef.current.scale.x;
    meshRef.current.scale.setScalar(THREE.MathUtils.lerp(currentScale, targetScale, 0.1));
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectBuilding(isSelected ? null : data.id);
  };

  return (
    <mesh
      ref={meshRef}
      position={data.position}
      material={material}
      onClick={handleClick}
      castShadow
    >
      <boxGeometry args={data.dimensions} />
    </mesh>
  );
}
