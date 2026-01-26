'use client';

import { useMemo, useRef, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { RoadData, ConnectionType } from '@/types/repository';
import { useVisualizationStore } from '@/stores/visualizationStore';

interface ConnectionsProps {
  roads: RoadData[];
  opacity?: number;
}

interface SingleConnectionProps {
  road: RoadData;
  isHighlighted: boolean;
  isHovered: boolean;
  isSelected: boolean;
  baseOpacity: number;
  onHover: (road: RoadData | null) => void;
  onClick: (road: RoadData) => void;
}

function SingleConnection({
  road,
  isHighlighted,
  isHovered,
  isSelected,
  baseOpacity,
  onHover,
  onClick,
}: SingleConnectionProps) {
  const lineRef = useRef<any>(null);
  const curveIdRef = useRef(Math.random()); // Stable random for this connection

  // Create curved path with bezier
  const curvePoints = useMemo(() => {
    if (road.points.length < 2) return [];

    const start = new THREE.Vector3(...road.points[0]);
    const end = new THREE.Vector3(...road.points[road.points.length - 1]);

    // Calculate midpoint with lift (use stable random per connection)
    const mid = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5);
    mid.y += 0.5 + curveIdRef.current * 0.5; // Lift the curve

    // Create quadratic bezier curve
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(20);
  }, [road.points]);

  // Calculate opacity based on state
  const targetOpacity = useMemo(() => {
    if (isSelected) return 1.0 * baseOpacity;
    if (isHovered) return 0.9 * baseOpacity;
    if (isHighlighted) return 0.7 * baseOpacity;
    return 0.15 * baseOpacity;
  }, [isSelected, isHovered, isHighlighted, baseOpacity]);

  // Calculate line width based on state
  const targetWidth = useMemo(() => {
    const baseWidth = road.width;
    if (isSelected) return baseWidth * 4;
    if (isHovered) return baseWidth * 3;
    if (isHighlighted) return baseWidth * 2;
    return baseWidth;
  }, [road.width, isSelected, isHovered, isHighlighted]);

  // Animate opacity and width
  useFrame(() => {
    if (!lineRef.current?.material) return;
    const material = lineRef.current.material;
    material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.1);
  });

  // Handle pointer events
  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(road);
    document.body.style.cursor = 'pointer';
  }, [road, onHover]);

  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(null);
    document.body.style.cursor = 'auto';
  }, [onHover]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick(road);
  }, [road, onClick]);

  if (curvePoints.length === 0) return null;

  // Create dashed effect for dashed/dotted patterns
  const dashArray = road.pattern === 'dashed' ? [0.3, 0.15] : road.pattern === 'dotted' ? [0.1, 0.1] : undefined;

  return (
    <Line
      ref={lineRef}
      points={curvePoints}
      color={road.color}
      lineWidth={targetWidth}
      transparent
      opacity={0.15 * baseOpacity}
      dashed={road.pattern !== 'solid'}
      dashScale={road.pattern === 'dotted' ? 10 : 5}
      dashSize={road.pattern === 'dotted' ? 0.1 : 0.3}
      gapSize={road.pattern === 'dotted' ? 0.1 : 0.15}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  );
}

export function Connections({ roads, opacity = 1 }: ConnectionsProps) {
  const {
    selectedBuildingId,
    cityData,
    connectionFilters,
    hoveredConnectionId,
    selectedConnectionId,
    hoverConnection,
    selectConnection,
  } = useVisualizationStore();

  // Find file ID for selected building
  const selectedFileId = useMemo(() => {
    if (!selectedBuildingId || !cityData) return null;

    for (const district of cityData.districts) {
      const building = district.buildings.find(b => b.id === selectedBuildingId);
      if (building) {
        return building.fileId;
      }
    }
    return null;
  }, [selectedBuildingId, cityData]);

  // Filter roads based on connection type filters
  const filteredRoads = useMemo(() => {
    return roads.filter(road => {
      const filterKey = road.connectionType as keyof typeof connectionFilters;
      return connectionFilters[filterKey] !== false;
    });
  }, [roads, connectionFilters]);

  // Find connections related to selected building
  const highlightedConnectionIds = useMemo(() => {
    if (!selectedFileId) return new Set<string>();

    // Highlight roads where selected file is source OR target
    return new Set(
      filteredRoads
        .filter(r => r.sourceFileId === selectedFileId || r.targetFileId === selectedFileId)
        .map(r => r.id)
    );
  }, [selectedFileId, filteredRoads]);

  // Handlers
  const handleHover = useCallback((road: RoadData | null) => {
    hoverConnection(road?.id || null, road);
  }, [hoverConnection]);

  const handleClick = useCallback((road: RoadData) => {
    // Toggle selection
    if (selectedConnectionId === road.id) {
      selectConnection(null, null);
    } else {
      selectConnection(road.id, road);
    }
  }, [selectedConnectionId, selectConnection]);

  return (
    <group>
      {filteredRoads.map((road) => (
        <SingleConnection
          key={road.id}
          road={road}
          isHighlighted={highlightedConnectionIds.has(road.id)}
          isHovered={hoveredConnectionId === road.id}
          isSelected={selectedConnectionId === road.id}
          baseOpacity={opacity}
          onHover={handleHover}
          onClick={handleClick}
        />
      ))}
    </group>
  );
}
