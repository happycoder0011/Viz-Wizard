'use client';

import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { RoadData, ConnectionType } from '@/types/repository';
import { useVisualizationStore } from '@/stores/visualizationStore';

interface BatchedConnectionsProps {
  roads: RoadData[];
}

const POINTS_PER_CURVE = 10;
const _start = new THREE.Vector3();
const _mid = new THREE.Vector3();
const _end = new THREE.Vector3();

interface ConnectionRange {
  startVertex: number;
  vertexCount: number;
  type: ConnectionType;
  sourceFileId: string;
  targetFileId: string;
  color: THREE.Color;
}

export function BatchedConnections({ roads }: BatchedConnectionsProps) {
  const lineRef = useRef<THREE.LineSegments>(null);

  const {
    connectionFilters,
    selectedBuildingId,
    flatBuildings,
    buildingIdToIndex,
  } = useVisualizationStore();

  // Find file ID for selected building
  const selectedFileId = useMemo(() => {
    if (!selectedBuildingId) return null;
    const idx = buildingIdToIndex.get(selectedBuildingId);
    if (idx === undefined) return null;
    return flatBuildings[idx]?.fileId ?? null;
  }, [selectedBuildingId, buildingIdToIndex, flatBuildings]);

  // Pre-compute all curves into a single buffer
  const { positions, colors, ranges, originalPositions } = useMemo(() => {
    // Each curve: POINTS_PER_CURVE points -> (POINTS_PER_CURVE-1) segments -> 2*(POINTS_PER_CURVE-1) vertices
    const verticesPerCurve = (POINTS_PER_CURVE - 1) * 2;
    const totalVertices = roads.length * verticesPerCurve;
    const pos = new Float32Array(totalVertices * 3);
    const col = new Float32Array(totalVertices * 3);
    const origPos = new Float32Array(totalVertices * 3);
    const rangeList: ConnectionRange[] = [];

    let vertexOffset = 0;

    for (let r = 0; r < roads.length; r++) {
      const road = roads[r];
      if (road.points.length < 2) {
        rangeList.push({
          startVertex: vertexOffset,
          vertexCount: 0,
          type: road.connectionType,
          sourceFileId: road.sourceFileId,
          targetFileId: road.targetFileId,
          color: new THREE.Color(road.color),
        });
        continue;
      }

      const p = road.points;
      _start.set(p[0][0], p[0][1], p[0][2]);
      _end.set(p[p.length - 1][0], p[p.length - 1][1], p[p.length - 1][2]);

      // Midpoint with lift
      _mid.addVectors(_start, _end).multiplyScalar(0.5);
      _mid.y += 0.5 + (r % 100) * 0.005; // deterministic per-connection lift

      const curve = new THREE.QuadraticBezierCurve3(_start.clone(), _mid.clone(), _end.clone());
      const curvePoints = curve.getPoints(POINTS_PER_CURVE - 1);

      const roadColor = new THREE.Color(road.color);
      const rangeStart = vertexOffset;

      // Create line segments: p0-p1, p1-p2, p2-p3, ...
      for (let j = 0; j < curvePoints.length - 1; j++) {
        const a = curvePoints[j];
        const b = curvePoints[j + 1];

        const vi = vertexOffset * 3;
        pos[vi] = a.x; pos[vi + 1] = a.y; pos[vi + 2] = a.z;
        col[vi] = roadColor.r; col[vi + 1] = roadColor.g; col[vi + 2] = roadColor.b;
        origPos[vi] = a.x; origPos[vi + 1] = a.y; origPos[vi + 2] = a.z;
        vertexOffset++;

        const vi2 = vertexOffset * 3;
        pos[vi2] = b.x; pos[vi2 + 1] = b.y; pos[vi2 + 2] = b.z;
        col[vi2] = roadColor.r; col[vi2 + 1] = roadColor.g; col[vi2 + 2] = roadColor.b;
        origPos[vi2] = b.x; origPos[vi2 + 1] = b.y; origPos[vi2 + 2] = b.z;
        vertexOffset++;
      }

      rangeList.push({
        startVertex: rangeStart,
        vertexCount: vertexOffset - rangeStart,
        type: road.connectionType,
        sourceFileId: road.sourceFileId,
        targetFileId: road.targetFileId,
        color: roadColor,
      });
    }

    return { positions: pos, colors: col, ranges: rangeList, originalPositions: origPos };
  }, [roads]);

  // Material
  const material = useMemo(() => new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  }), []);

  // Geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    (geo.getAttribute('position') as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    (geo.getAttribute('color') as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    return geo;
  }, [positions, colors]);

  // Update visibility (filtering) and highlighting
  useEffect(() => {
    if (!lineRef.current) return;

    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const colArr = colAttr.array as Float32Array;

    for (const range of ranges) {
      const filterKey = range.type as keyof typeof connectionFilters;
      const isFiltered = connectionFilters[filterKey] === false;
      const isHighlighted = selectedFileId &&
        (range.sourceFileId === selectedFileId || range.targetFileId === selectedFileId);

      for (let v = range.startVertex; v < range.startVertex + range.vertexCount; v++) {
        const vi = v * 3;

        if (isFiltered) {
          // Hide by collapsing to origin
          posArr[vi] = 0;
          posArr[vi + 1] = 0;
          posArr[vi + 2] = 0;
        } else {
          // Restore original position
          posArr[vi] = originalPositions[vi];
          posArr[vi + 1] = originalPositions[vi + 1];
          posArr[vi + 2] = originalPositions[vi + 2];
        }

        if (isHighlighted && !isFiltered) {
          // Brighten highlighted connections
          colArr[vi] = Math.min(1, range.color.r * 2);
          colArr[vi + 1] = Math.min(1, range.color.g * 2);
          colArr[vi + 2] = Math.min(1, range.color.b * 2);
        } else {
          colArr[vi] = range.color.r;
          colArr[vi + 1] = range.color.g;
          colArr[vi + 2] = range.color.b;
        }
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    // Adjust opacity based on whether anything is selected
    material.opacity = selectedFileId ? 0.15 : 0.25;
  }, [connectionFilters, selectedFileId, geometry, ranges, originalPositions, material]);

  // Cleanup
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  if (roads.length === 0) return null;

  return (
    <lineSegments
      ref={lineRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  );
}
