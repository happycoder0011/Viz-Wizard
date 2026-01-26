'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingData } from '@/types/repository';
import { useVisualizationStore } from '@/stores/visualizationStore';

interface BuildingProps {
  data: BuildingData;
}

export function Building({ data }: BuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  const {
    selectedBuildingId,
    hoveredBuildingId,
    selectBuilding,
    hoverBuilding,
  } = useVisualizationStore();

  const isSelected = selectedBuildingId === data.id;
  const isOtherHovered = hoveredBuildingId !== null && hoveredBuildingId !== data.id;

  // Create materials
  const materials = useMemo(() => {
    const baseColor = new THREE.Color(data.color);
    const emissiveColor = new THREE.Color(data.emissiveColor);

    return {
      standard: new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: emissiveColor,
        emissiveIntensity: data.emissiveIntensity,
        metalness: 0.3,
        roughness: 0.4,
      }),
      hovered: new THREE.MeshStandardMaterial({
        color: baseColor.clone().multiplyScalar(1.2),
        emissive: emissiveColor,
        emissiveIntensity: data.emissiveIntensity * 2,
        metalness: 0.2,
        roughness: 0.3,
      }),
      selected: new THREE.MeshStandardMaterial({
        color: baseColor.clone().multiplyScalar(1.4),
        emissive: emissiveColor,
        emissiveIntensity: data.emissiveIntensity * 3,
        metalness: 0.1,
        roughness: 0.2,
      }),
    };
  }, [data.color, data.emissiveColor, data.emissiveIntensity]);

  // Animate on hover/selection
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Target scale
    let targetScale = 1;
    if (isSelected) targetScale = 1.1;
    else if (isHovered) targetScale = 1.05;
    else if (isOtherHovered) targetScale = 0.95;

    // Smooth scale transition
    const currentScale = meshRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 8);
    meshRef.current.scale.setScalar(newScale);

    // Subtle floating animation for selected building
    if (isSelected) {
      const floatOffset = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.position.y = data.position[1] + floatOffset;
    } else {
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        data.position[1],
        delta * 5
      );
    }
  });

  // Get current material
  const material = isSelected
    ? materials.selected
    : isHovered
    ? materials.hovered
    : materials.standard;

  // Event handlers
  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setIsHovered(true);
    hoverBuilding(data.id, data);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setIsHovered(false);
    hoverBuilding(null, null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectBuilding(isSelected ? null : data.id);
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        position={data.position}
        material={material}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        castShadow
        receiveShadow
      >
        <boxGeometry args={data.dimensions} />
      </mesh>

      {/* Building base glow */}
      <mesh
        position={[data.position[0], 0.01, data.position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[data.dimensions[0] + 0.5, data.dimensions[2] + 0.5]} />
        <meshBasicMaterial
          color={data.emissiveColor}
          transparent
          opacity={isSelected ? 0.4 : isHovered ? 0.25 : 0.1}
        />
      </mesh>
    </group>
  );
}
