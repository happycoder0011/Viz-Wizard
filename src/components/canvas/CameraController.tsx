'use client';

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useVisualizationStore } from '@/stores/visualizationStore';

export function CameraController() {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const lastDistanceRef = useRef<number>(50);

  const {
    cameraTarget,
    isAnimatingCamera,
    setIsAnimatingCamera,
    setCameraDistance,
  } = useVisualizationStore();

  // Track camera distance and update zoom level
  useFrame(() => {
    if (!controlsRef.current) return;

    const target = controlsRef.current.target as THREE.Vector3;
    const distance = camera.position.distanceTo(target);

    // Only update if distance changed significantly (performance optimization)
    if (Math.abs(distance - lastDistanceRef.current) > 0.5) {
      lastDistanceRef.current = distance;
      setCameraDistance(distance);
    }
  });

  // Smooth camera animation to target
  useFrame((state, delta) => {
    if (!cameraTarget || !isAnimatingCamera) return;

    const targetPosition = new THREE.Vector3(...cameraTarget.position);
    const targetLookAt = new THREE.Vector3(...cameraTarget.lookAt);

    // Lerp camera position
    camera.position.lerp(targetPosition, delta * 3);

    // Update controls target
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt, delta * 3);
    }

    // Check if we've reached the target
    const positionDistance = camera.position.distanceTo(targetPosition);
    if (positionDistance < 0.5) {
      setIsAnimatingCamera(false);
    }
  });

  // Set initial camera position
  useEffect(() => {
    camera.position.set(30, 25, 30);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
    }
    // Initial distance calculation
    setCameraDistance(camera.position.distanceTo(new THREE.Vector3(0, 0, 0)));
  }, [camera, setCameraDistance]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      enableZoom
      zoomSpeed={1.2}
      enablePan
      panSpeed={1.0}
      enableRotate
      rotateSpeed={0.8}
      minDistance={3}
      maxDistance={200}
      minPolarAngle={0.05}
      maxPolarAngle={Math.PI - 0.05} // Full vertical freedom
      target={[0, 0, 0]}
    />
  );
}
