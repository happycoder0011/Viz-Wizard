'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { ClusterData, BreadcrumbItem, ZoomLevel } from '@/types/repository';
import { useVisualizationStore } from '@/stores/visualizationStore';

interface ClusterProps {
  data: ClusterData;
  zoomLevel: ZoomLevel;
}

export function Cluster({ data, zoomLevel }: ClusterProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  const { navigateTo, showLabels, focusedClusterId } = useVisualizationStore();

  const isFocused = focusedClusterId === data.id;

  // Create materials
  const materials = useMemo(() => {
    const baseColor = new THREE.Color(data.color);

    return {
      standard: new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: 0.3,
        metalness: 0.4,
        roughness: 0.3,
        transparent: true,
        opacity: 0.85,
      }),
      hovered: new THREE.MeshStandardMaterial({
        color: baseColor.clone().multiplyScalar(1.3),
        emissive: baseColor,
        emissiveIntensity: 0.6,
        metalness: 0.3,
        roughness: 0.2,
        transparent: true,
        opacity: 0.95,
      }),
    };
  }, [data.color]);

  // Animate hover and pulse
  useFrame((state) => {
    if (!meshRef.current) return;

    // Subtle pulse animation
    const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.05 + 1;
    const targetScale = isHovered ? 1.1 : (isFocused ? 1.05 : 1);
    const currentScale = meshRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale * pulse, 0.1);
    meshRef.current.scale.setScalar(newScale);

    // Glow pulse
    if (glowRef.current) {
      const glowScale = 1.3 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
      glowRef.current.scale.setScalar(data.radius * glowScale);
    }
  });

  // Handle click - navigate into cluster
  const handleClick = (e: any) => {
    e.stopPropagation();

    const breadcrumbItem: BreadcrumbItem = {
      id: data.id,
      name: data.name,
      path: data.path,
      level: zoomLevel,
      position: data.position,
    };

    navigateTo(breadcrumbItem);
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setIsHovered(false);
    document.body.style.cursor = 'auto';
  };

  return (
    <group position={data.position}>
      {/* Main cluster sphere */}
      <Sphere
        ref={meshRef}
        args={[data.radius, 32, 32]}
        material={isHovered ? materials.hovered : materials.standard}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />

      {/* Outer glow */}
      <Sphere
        ref={glowRef}
        args={[data.radius * 1.3, 16, 16]}
      >
        <meshBasicMaterial
          color={data.color}
          transparent
          opacity={isHovered ? 0.15 : 0.08}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Ground glow */}
      <mesh
        position={[0, -data.position[1] + 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[data.radius * 1.5, 32]} />
        <meshBasicMaterial
          color={data.color}
          transparent
          opacity={isHovered ? 0.25 : 0.1}
        />
      </mesh>

      {/* Label */}
      {showLabels && (
        <group position={[0, data.radius + 1.5, 0]}>
          <Text
            fontSize={1.2}
            color={isHovered ? '#ffffff' : '#aaaaaa'}
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            {data.name}
          </Text>
          <Text
            position={[0, -1.2, 0]}
            fontSize={0.7}
            color="#666666"
            anchorX="center"
            anchorY="top"
          >
            {data.fileCount} files • {formatLines(data.totalLines)}
          </Text>
        </group>
      )}

      {/* Info badge when hovered */}
      {isHovered && (
        <group position={[0, data.radius + 4, 0]}>
          <mesh>
            <planeGeometry args={[8, 3]} />
            <meshBasicMaterial color="#0a0a12" transparent opacity={0.9} />
          </mesh>
          <Text
            position={[0, 0.5, 0.01]}
            fontSize={0.6}
            color="#00ffff"
            anchorX="center"
          >
            {data.name}
          </Text>
          <Text
            position={[0, -0.3, 0.01]}
            fontSize={0.45}
            color="#888888"
            anchorX="center"
          >
            {data.fileCount} files • {formatLines(data.totalLines)} lines
          </Text>
          <Text
            position={[0, -0.9, 0.01]}
            fontSize={0.4}
            color="#666666"
            anchorX="center"
          >
            Click to zoom in
          </Text>
        </group>
      )}
    </group>
  );
}

function formatLines(lines: number): string {
  if (lines >= 1000000) return `${(lines / 1000000).toFixed(1)}M`;
  if (lines >= 1000) return `${(lines / 1000).toFixed(1)}K`;
  return lines.toString();
}
