'use client';

import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Stars, Preload } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { City } from './City';
import { CameraController } from './CameraController';
import { useVisualizationStore } from '@/stores/visualizationStore';

// Loading fallback for 3D scene
function SceneLoader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#00ffff" wireframe />
    </mesh>
  );
}

// Lighting setup
function Lighting() {
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.15} color="#4466aa" />

      {/* Main directional light */}
      <directionalLight
        position={[20, 30, 10]}
        intensity={0.8}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* Fill light from opposite side */}
      <directionalLight
        position={[-15, 20, -10]}
        intensity={0.3}
        color="#6688cc"
      />

      {/* Cyan accent light */}
      <pointLight
        position={[0, 15, 0]}
        intensity={0.5}
        color="#00ffff"
        distance={50}
        decay={2}
      />
    </>
  );
}

// Post-processing effects
function PostProcessing() {
  const { bloomIntensity } = useVisualizationStore();

  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
        radius={0.8}
      />
      <Vignette
        offset={0.3}
        darkness={0.6}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

// Fog and atmosphere
function Atmosphere() {
  return (
    <>
      <fog attach="fog" args={['#0a0a12', 30, 120]} />
      <Stars
        radius={100}
        depth={50}
        count={2000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />
    </>
  );
}

// Main scene content
function SceneContent() {
  const { cityData } = useVisualizationStore();

  if (!cityData) {
    return <SceneLoader />;
  }

  return <City data={cityData} />;
}

// Hook to load fixture - runs outside Canvas
function useInitializeScene() {
  const { currentFixture, loadFixture, cityData } = useVisualizationStore();

  useEffect(() => {
    if (!cityData) {
      console.log('[useInitializeScene] Loading fixture:', currentFixture);
      loadFixture(currentFixture);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

export function Scene() {
  // Initialize scene data before rendering Canvas
  useInitializeScene();

  const { hoverBuilding } = useVisualizationStore();

  // Clear hover state when pointer misses all objects
  const handlePointerMissed = () => {
    hoverBuilding(null, null);
    document.body.style.cursor = 'auto';
  };

  return (
    <Canvas
      className="canvas-container"
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      camera={{
        fov: 50,
        near: 0.1,
        far: 500,
        position: [30, 25, 30],
      }}
      onPointerMissed={handlePointerMissed}
    >
      <color attach="background" args={['#050508']} />

      <Atmosphere />
      <Lighting />

      <Suspense fallback={<SceneLoader />}>
        <SceneContent />
        <Preload all />
      </Suspense>

      <CameraController />
      <PostProcessing />
    </Canvas>
  );
}
