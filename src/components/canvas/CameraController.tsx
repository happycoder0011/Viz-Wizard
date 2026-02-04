'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useVisualizationStore } from '@/stores/visualizationStore';

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _move = new THREE.Vector3();

const MOVE_SPEED = 30; // units per second
const MIN_Y = 1.5; // camera never goes below this

export function CameraController() {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const lastDistanceRef = useRef<number>(50);
  const keysRef = useRef<Set<string>>(new Set());

  const {
    cameraTarget,
    isAnimatingCamera,
    setIsAnimatingCamera,
    setCameraDistance,
  } = useVisualizationStore();

  // Keyboard listeners
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't capture when typing in inputs
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    keysRef.current.add(e.code);

    // T = top-down view
    if (e.code === 'KeyT') {
      e.preventDefault();
      if (controlsRef.current) {
        const target = controlsRef.current.target as THREE.Vector3;
        camera.position.set(target.x, 60, target.z + 0.01);
      }
    }
  }, [camera]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.code);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // WASD / arrow key movement + distance tracking
  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const target = controls.target as THREE.Vector3;

    const keys = keysRef.current;
    if (keys.size > 0) {
      // Forward direction: camera's look direction projected onto XZ plane
      _forward.subVectors(target, camera.position);
      _forward.y = 0;
      _forward.normalize();

      // Right direction
      _right.crossVectors(_forward, camera.up).normalize();

      _move.set(0, 0, 0);

      // Forward / backward
      if (keys.has('KeyW') || keys.has('ArrowUp')) _move.add(_forward);
      if (keys.has('KeyS') || keys.has('ArrowDown')) _move.sub(_forward);

      // Left / right
      if (keys.has('KeyD') || keys.has('ArrowRight')) _move.add(_right);
      if (keys.has('KeyA') || keys.has('ArrowLeft')) _move.sub(_right);

      // Up / down
      if (keys.has('Space')) _move.y += 1;
      if (keys.has('ShiftLeft') || keys.has('ShiftRight')) _move.y -= 1;

      if (_move.lengthSq() > 0) {
        _move.normalize().multiplyScalar(MOVE_SPEED * delta);

        // Move both camera and orbit target together (translates through space)
        camera.position.add(_move);
        target.add(_move);

        // Clamp camera above ground
        if (camera.position.y < MIN_Y) {
          const diff = MIN_Y - camera.position.y;
          camera.position.y = MIN_Y;
          target.y += diff;
        }
      }
    }

    // Track distance for zoom level
    const distance = camera.position.distanceTo(target);
    if (Math.abs(distance - lastDistanceRef.current) > 0.5) {
      lastDistanceRef.current = distance;
      setCameraDistance(distance);
    }
  });

  // Smooth camera animation to target (from insights "show me", etc.)
  useFrame((_, delta) => {
    if (!cameraTarget || !isAnimatingCamera) return;

    const targetPosition = new THREE.Vector3(...cameraTarget.position);
    const targetLookAt = new THREE.Vector3(...cameraTarget.lookAt);

    camera.position.lerp(targetPosition, delta * 3);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt, delta * 3);
    }

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
      maxPolarAngle={Math.PI / 2.1}
      target={[0, 0, 0]}
    />
  );
}
