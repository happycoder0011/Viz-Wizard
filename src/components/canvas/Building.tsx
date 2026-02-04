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

  // Get these separately to avoid potential issues with Set access
  const highlightedFileIds = useVisualizationStore(state => state.highlightedFileIds);
  const findUsagesOpen = useVisualizationStore(state => state.findUsagesOpen);
  const criticalPathEnabled = useVisualizationStore(state => state.criticalPathEnabled);
  const criticalFileIds = useVisualizationStore(state => state.criticalFileIds);
  const criticalFiles = useVisualizationStore(state => state.criticalFiles);
  const insightsHighlightedFileIds = useVisualizationStore(state => state.insightsHighlightedFileIds);

  const isSelected = selectedBuildingId === data.id;
  const isOtherHovered = hoveredBuildingId !== null && hoveredBuildingId !== data.id;
  const isHighlighted = highlightedFileIds instanceof Set ? highlightedFileIds.has(data.fileId) : false;
  const isInFindUsagesMode = findUsagesOpen === true;
  const isCritical = criticalFileIds instanceof Set ? criticalFileIds.has(data.fileId) : false;
  const isInCriticalPathMode = criticalPathEnabled === true;
  const isInsightsHighlighted = insightsHighlightedFileIds instanceof Set ? insightsHighlightedFileIds.has(data.fileId) : false;
  const isInInsightsMode = insightsHighlightedFileIds instanceof Set && insightsHighlightedFileIds.size > 0;

  // Get risk score for this file if in critical path mode
  const riskScore = isInCriticalPathMode && isCritical
    ? criticalFiles.find(f => f.fileId === data.fileId)?.overallRisk ?? 0
    : 0;

  // Create materials
  const materials = useMemo(() => {
    const baseColor = new THREE.Color(data.color);
    const emissiveColor = new THREE.Color(data.emissiveColor);
    const highlightColor = new THREE.Color('#00ff88'); // Green highlight for find usages
    const goldColor = new THREE.Color('#ffd700'); // Gold for critical path
    const criticalColor = new THREE.Color('#ff4444'); // Red for very critical

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
      highlighted: new THREE.MeshStandardMaterial({
        color: baseColor.clone().lerp(highlightColor, 0.3),
        emissive: highlightColor,
        emissiveIntensity: 1.5,
        metalness: 0.2,
        roughness: 0.3,
      }),
      dimmed: new THREE.MeshStandardMaterial({
        color: baseColor.clone().multiplyScalar(0.3),
        emissive: emissiveColor.clone().multiplyScalar(0.2),
        emissiveIntensity: data.emissiveIntensity * 0.2,
        metalness: 0.3,
        roughness: 0.6,
        transparent: true,
        opacity: 0.6,
      }),
      // Critical path materials
      critical: new THREE.MeshStandardMaterial({
        color: goldColor,
        emissive: goldColor,
        emissiveIntensity: 2.0,
        metalness: 0.6,
        roughness: 0.2,
      }),
      criticalHovered: new THREE.MeshStandardMaterial({
        color: goldColor.clone().multiplyScalar(1.2),
        emissive: goldColor,
        emissiveIntensity: 3.0,
        metalness: 0.5,
        roughness: 0.15,
      }),
      criticalHigh: new THREE.MeshStandardMaterial({
        color: criticalColor.clone().lerp(goldColor, 0.5),
        emissive: criticalColor,
        emissiveIntensity: 2.5,
        metalness: 0.5,
        roughness: 0.2,
      }),
      grayscale: new THREE.MeshStandardMaterial({
        color: new THREE.Color(0.2, 0.2, 0.22),
        emissive: new THREE.Color(0.05, 0.05, 0.06),
        emissiveIntensity: 0.3,
        metalness: 0.2,
        roughness: 0.7,
        transparent: true,
        opacity: 0.5,
      }),
    };
  }, [data.color, data.emissiveColor, data.emissiveIntensity]);

  // Animate on hover/selection/highlighting
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Target scale
    let targetScale = 1;
    if (isInCriticalPathMode) {
      // In critical path mode
      if (isCritical) {
        targetScale = isHovered ? 1.2 : 1.1;
      } else {
        targetScale = 0.85; // Shrink non-critical buildings
      }
    } else if (isInFindUsagesMode) {
      // In find usages mode
      if (isHighlighted) {
        targetScale = isHovered ? 1.15 : 1.08;
      } else {
        targetScale = 0.9; // Dim non-highlighted buildings
      }
    } else if (isInInsightsMode) {
      // In insights highlight mode
      if (isInsightsHighlighted) {
        targetScale = isHovered ? 1.15 : 1.08;
      } else {
        targetScale = 0.9;
      }
    } else {
      // Normal mode
      if (isSelected) targetScale = 1.1;
      else if (isHovered) targetScale = 1.05;
      else if (isOtherHovered) targetScale = 0.95;
    }

    // Smooth scale transition
    const currentScale = meshRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 8);
    meshRef.current.scale.setScalar(newScale);

    // Floating animation for critical/selected/highlighted buildings
    const shouldFloat = isSelected ||
      (isInFindUsagesMode && isHighlighted) ||
      (isInCriticalPathMode && isCritical) ||
      (isInInsightsMode && isInsightsHighlighted);

    if (shouldFloat) {
      // More dramatic float for critical buildings
      const floatIntensity = isInCriticalPathMode && isCritical ? 0.15 : 0.1;
      const floatSpeed = isInCriticalPathMode && isCritical ? 2.5 : 2;
      const floatOffset = Math.sin(state.clock.elapsedTime * floatSpeed) * floatIntensity;
      meshRef.current.position.y = data.position[1] + floatOffset;
    } else {
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        data.position[1],
        delta * 5
      );
    }
  });

  // Get current material - prioritize special modes
  const material = useMemo(() => {
    if (isInCriticalPathMode) {
      // In critical path mode, show gold for critical files, grayscale for others
      if (isCritical) {
        if (isHovered) return materials.criticalHovered;
        if (riskScore >= 70) return materials.criticalHigh;
        return materials.critical;
      } else {
        return materials.grayscale;
      }
    }
    if (isInFindUsagesMode) {
      // In find usages mode, highlight related files and dim others
      if (isHighlighted) {
        return isHovered ? materials.selected : materials.highlighted;
      } else {
        return materials.dimmed;
      }
    }
    if (isInInsightsMode) {
      // In insights highlight mode
      if (isInsightsHighlighted) {
        return isHovered ? materials.selected : materials.highlighted;
      } else {
        return materials.dimmed;
      }
    }
    // Normal mode
    if (isSelected) return materials.selected;
    if (isHovered) return materials.hovered;
    return materials.standard;
  }, [isInCriticalPathMode, isCritical, riskScore, isInFindUsagesMode, isHighlighted, isInInsightsMode, isInsightsHighlighted, isSelected, isHovered, materials]);

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
          color={
            isInCriticalPathMode && isCritical
              ? (riskScore >= 70 ? '#ff4444' : '#ffd700')
              : isInFindUsagesMode && isHighlighted
              ? '#00ff88'
              : isInInsightsMode && isInsightsHighlighted
              ? '#00ff88'
              : data.emissiveColor
          }
          transparent
          opacity={
            isInCriticalPathMode
              ? isCritical ? 0.6 : 0.03
              : isInFindUsagesMode
              ? isHighlighted ? 0.5 : 0.05
              : isInInsightsMode
              ? isInsightsHighlighted ? 0.5 : 0.05
              : isSelected ? 0.4 : isHovered ? 0.25 : 0.1
          }
        />
      </mesh>
    </group>
  );
}
