'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { CityData, ClusterData } from '@/types/repository';
import { District } from './District';
import { Connections } from './Connections';
import { Cluster } from './Cluster';
import { useVisualizationStore } from '@/stores/visualizationStore';
import { generateSatelliteClusters, generateRegionalClusters } from '@/lib/clustering';

interface CityProps {
  data: CityData;
}

export function City({ data }: CityProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { currentZoomLevel, showConnections } = useVisualizationStore();

  // Generate clusters for different zoom levels
  const satelliteClusters = useMemo(() => generateSatelliteClusters(data), [data]);
  const regionalClusters = useMemo(() => generateRegionalClusters(data), [data]);

  // Create ground grid - scale based on zoom level
  const gridHelper = useMemo(() => {
    const baseSize = Math.max(data.bounds.width, data.bounds.depth) + 40;
    const size = currentZoomLevel === 'satellite' ? baseSize * 1.5 : baseSize;
    const divisions = Math.floor(size / (currentZoomLevel === 'satellite' ? 10 : 5));

    return (
      <gridHelper
        args={[size, divisions, '#1a1a2e', '#0d0d14']}
        position={[0, 0, 0]}
      />
    );
  }, [data.bounds, currentZoomLevel]);

  // Infinite ground plane
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

  // Render content based on zoom level
  const renderContent = () => {
    switch (currentZoomLevel) {
      case 'satellite':
        // Show high-level module clusters only
        return (
          <>
            {satelliteClusters.map((cluster) => (
              <Cluster key={cluster.id} data={cluster} zoomLevel="satellite" />
            ))}
          </>
        );

      case 'regional':
        // Show district clusters
        return (
          <>
            {regionalClusters.map((cluster) => (
              <Cluster key={cluster.id} data={cluster} zoomLevel="regional" />
            ))}
            {/* Show faded connections at regional level */}
            {showConnections && <Connections roads={data.roads} opacity={0.3} />}
          </>
        );

      case 'district':
        // Show districts with simplified buildings
        return (
          <>
            {showConnections && <Connections roads={data.roads} opacity={0.5} />}
            {data.districts.map((district) => (
              <District key={district.id} data={district} simplified />
            ))}
          </>
        );

      case 'street':
      default:
        // Full detail view
        return (
          <>
            {showConnections && <Connections roads={data.roads} />}
            {data.districts.map((district) => (
              <District key={district.id} data={district} />
            ))}
          </>
        );
    }
  };

  return (
    <group ref={groupRef}>
      {/* Ground */}
      {groundPlane}
      {gridHelper}

      {/* Zoom-level-specific content */}
      {renderContent()}
    </group>
  );
}
