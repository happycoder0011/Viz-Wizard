'use client';

import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { BuildingData } from '@/types/repository';
import { useVisualizationStore } from '@/stores/visualizationStore';

interface InstancedBuildingsProps {
  buildings: BuildingData[];
}

// Pre-allocated temp objects (module-level, zero GC)
const _mat = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _scl = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _color = new THREE.Color();
const _emissive = new THREE.Color();
const _glowC = new THREE.Color();

// Constant colors
const GOLD = new THREE.Color('#ffd700');
const CRITICAL_RED = new THREE.Color('#ff4444');
const HIGHLIGHT_GREEN = new THREE.Color('#00ff88');

export function InstancedBuildings({ buildings }: InstancedBuildingsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);

  // Animation refs
  const currentScales = useRef<Float32Array>(new Float32Array(0));
  const targetScales = useRef<Float32Array>(new Float32Array(0));
  const floatingSet = useRef<Set<number>>(new Set());

  // Base colors (pre-hover) for O(1) hover updates
  const baseColors = useRef<Float32Array>(new Float32Array(0));     // N*3
  const baseEmissives = useRef<Float32Array>(new Float32Array(0));  // N*3
  const baseGlowColors = useRef<Float32Array>(new Float32Array(0)); // N*3
  const prevHoveredIdx = useRef<number>(-1);

  // ID -> index lookup
  const idToIndex = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < buildings.length; i++) map.set(buildings[i].id, i);
    return map;
  }, [buildings]);

  // Store selectors — use individual selectors to minimize re-renders
  const selectedBuildingId = useVisualizationStore(s => s.selectedBuildingId);
  const hoveredBuildingId = useVisualizationStore(s => s.hoveredBuildingId);
  const selectBuilding = useVisualizationStore(s => s.selectBuilding);
  const hoverBuilding = useVisualizationStore(s => s.hoverBuilding);
  const highlightedFileIds = useVisualizationStore(s => s.highlightedFileIds);
  const findUsagesOpen = useVisualizationStore(s => s.findUsagesOpen);
  const criticalPathEnabled = useVisualizationStore(s => s.criticalPathEnabled);
  const criticalFileIds = useVisualizationStore(s => s.criticalFileIds);
  const criticalFiles = useVisualizationStore(s => s.criticalFiles);
  const insightsHighlightedFileIds = useVisualizationStore(s => s.insightsHighlightedFileIds);

  const isInFindUsagesMode = findUsagesOpen === true;
  const isInCriticalPathMode = criticalPathEnabled === true;
  const isInInsightsMode = insightsHighlightedFileIds instanceof Set && insightsHighlightedFileIds.size > 0;

  const criticalScoreMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of criticalFiles) map.set(f.fileId, f.overallRisk);
    return map;
  }, [criticalFiles]);

  // Geometries
  const boxGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    const arr = new Float32Array(buildings.length * 3);
    const attr = new THREE.InstancedBufferAttribute(arr, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('instanceEmissive', attr);
    return g;
  }, [buildings.length]);

  const glowGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  // Materials
  const buildingMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#000000',
      emissiveIntensity: 1.0,
      metalness: 0.3,
      roughness: 0.4,
    });
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
         attribute vec3 instanceEmissive;
         varying vec3 vInstanceEmissive;`
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vInstanceEmissive = instanceEmissive;`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
         varying vec3 vInstanceEmissive;`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         totalEmissiveRadiance += vInstanceEmissive;`
      );
    };
    mat.customProgramCacheKey = () => 'instanced-emissive';
    return mat;
  }, []);

  const glowMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  // Cleanup
  useEffect(() => {
    return () => {
      boxGeo.dispose();
      glowGeo.dispose();
      buildingMaterial.dispose();
      glowMaterial.dispose();
    };
  }, [boxGeo, glowGeo, buildingMaterial, glowMaterial]);

  // Helper: compute base appearance for a building (ignoring hover)
  function computeBase(
    b: BuildingData, i: number,
    outColor: THREE.Color, outEmissive: THREE.Color, outGlow: THREE.Color
  ): number /* targetScale */ {
    const isSelected = selectedBuildingId === b.id;
    const isHighlighted = highlightedFileIds instanceof Set && highlightedFileIds.has(b.fileId);
    const isCritical = criticalFileIds instanceof Set && criticalFileIds.has(b.fileId);
    const isInsightsHL = insightsHighlightedFileIds instanceof Set && insightsHighlightedFileIds.has(b.fileId);

    if (isInCriticalPathMode) {
      if (isCritical) {
        const risk = criticalScoreMap.get(b.fileId) ?? 0;
        floatingSet.current.add(i);
        if (risk >= 70) {
          outColor.copy(CRITICAL_RED).lerp(GOLD, 0.5);
          outEmissive.copy(CRITICAL_RED).multiplyScalar(2.0);
          outGlow.copy(CRITICAL_RED).multiplyScalar(0.6);
        } else {
          outColor.copy(GOLD);
          outEmissive.copy(GOLD).multiplyScalar(2.0);
          outGlow.copy(GOLD).multiplyScalar(0.6);
        }
        return 1.1;
      } else {
        outColor.setRGB(0.2, 0.2, 0.22);
        outEmissive.setRGB(0.015, 0.015, 0.018);
        outGlow.setRGB(0.02, 0.02, 0.02);
        return 0.85;
      }
    } else if (isInFindUsagesMode) {
      if (isHighlighted) {
        floatingSet.current.add(i);
        outColor.set(b.color).lerp(HIGHLIGHT_GREEN, 0.3);
        outEmissive.copy(HIGHLIGHT_GREEN).multiplyScalar(1.5);
        outGlow.copy(HIGHLIGHT_GREEN).multiplyScalar(0.5);
        return 1.08;
      } else {
        outColor.set(b.color).multiplyScalar(0.3);
        outEmissive.set(b.emissiveColor).multiplyScalar(0.04);
        outGlow.set(b.emissiveColor).multiplyScalar(0.02);
        return 0.9;
      }
    } else if (isInInsightsMode) {
      if (isInsightsHL) {
        floatingSet.current.add(i);
        outColor.set(b.color).lerp(HIGHLIGHT_GREEN, 0.3);
        outEmissive.copy(HIGHLIGHT_GREEN).multiplyScalar(1.5);
        outGlow.copy(HIGHLIGHT_GREEN).multiplyScalar(0.5);
        return 1.08;
      } else {
        outColor.set(b.color).multiplyScalar(0.3);
        outEmissive.set(b.emissiveColor).multiplyScalar(0.04);
        outGlow.set(b.emissiveColor).multiplyScalar(0.02);
        return 0.9;
      }
    } else {
      // Normal mode
      if (isSelected) {
        floatingSet.current.add(i);
        outColor.set(b.color).multiplyScalar(1.4);
        outEmissive.set(b.emissiveColor).multiplyScalar(b.emissiveIntensity * 3);
        outGlow.set(b.emissiveColor).multiplyScalar(0.4);
        return 1.1;
      } else {
        outColor.set(b.color);
        outEmissive.set(b.emissiveColor).multiplyScalar(b.emissiveIntensity);
        outGlow.set(b.emissiveColor).multiplyScalar(0.1);
        return 1;
      }
    }
  }

  // Initialize instance matrices (runs once per data load)
  useEffect(() => {
    const mesh = meshRef.current;
    const glow = glowRef.current;
    if (!mesh || !glow || buildings.length === 0) return;

    currentScales.current = new Float32Array(buildings.length).fill(1);
    targetScales.current = new Float32Array(buildings.length).fill(1);
    baseColors.current = new Float32Array(buildings.length * 3);
    baseEmissives.current = new Float32Array(buildings.length * 3);
    baseGlowColors.current = new Float32Array(buildings.length * 3);

    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      const [px, py, pz] = b.position;
      const [w, h, d] = b.dimensions;

      _mat.compose(_pos.set(px, py, pz), _quat.identity(), _scl.set(w, h, d));
      mesh.setMatrixAt(i, _mat);

      _color.set(b.color);
      mesh.setColorAt(i, _color);

      _emissive.set(b.emissiveColor).multiplyScalar(b.emissiveIntensity);
      const emArr = (boxGeo.getAttribute('instanceEmissive') as THREE.InstancedBufferAttribute).array as Float32Array;
      emArr[i * 3] = _emissive.r;
      emArr[i * 3 + 1] = _emissive.g;
      emArr[i * 3 + 2] = _emissive.b;

      _mat.compose(_pos.set(px, 0.01, pz), _quat.identity(), _scl.set(w + 0.5, d + 0.5, 1));
      glow.setMatrixAt(i, _mat);

      _glowC.set(b.emissiveColor).multiplyScalar(0.1);
      glow.setColorAt(i, _glowC);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    glow.instanceMatrix.needsUpdate = true;
    if (glow.instanceColor) glow.instanceColor.needsUpdate = true;
    const emAttr = boxGeo.getAttribute('instanceEmissive') as THREE.BufferAttribute;
    if (emAttr) emAttr.needsUpdate = true;
  }, [buildings, boxGeo]);

  // MODE CHANGE: update ALL instance colors (runs rarely — on select, critical path, find usages, insights)
  useEffect(() => {
    const mesh = meshRef.current;
    const glow = glowRef.current;
    if (!mesh || !glow || buildings.length === 0) return;

    const emArr = (boxGeo.getAttribute('instanceEmissive') as THREE.InstancedBufferAttribute).array as Float32Array;
    floatingSet.current.clear();

    for (let i = 0; i < buildings.length; i++) {
      const scale = computeBase(buildings[i], i, _color, _emissive, _glowC);
      targetScales.current[i] = scale;

      mesh.setColorAt(i, _color);
      emArr[i * 3] = _emissive.r;
      emArr[i * 3 + 1] = _emissive.g;
      emArr[i * 3 + 2] = _emissive.b;
      glow.setColorAt(i, _glowC);

      // Store base colors for hover overlay
      baseColors.current[i * 3] = _color.r;
      baseColors.current[i * 3 + 1] = _color.g;
      baseColors.current[i * 3 + 2] = _color.b;
      baseEmissives.current[i * 3] = _emissive.r;
      baseEmissives.current[i * 3 + 1] = _emissive.g;
      baseEmissives.current[i * 3 + 2] = _emissive.b;
      baseGlowColors.current[i * 3] = _glowC.r;
      baseGlowColors.current[i * 3 + 1] = _glowC.g;
      baseGlowColors.current[i * 3 + 2] = _glowC.b;
    }

    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (glow.instanceColor) glow.instanceColor.needsUpdate = true;
    const emAttr = boxGeo.getAttribute('instanceEmissive') as THREE.BufferAttribute;
    if (emAttr) emAttr.needsUpdate = true;

    prevHoveredIdx.current = -1; // reset hover after mode change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    buildings, boxGeo, selectedBuildingId,
    highlightedFileIds, isInFindUsagesMode,
    criticalFileIds, criticalScoreMap, isInCriticalPathMode,
    insightsHighlightedFileIds, isInInsightsMode,
  ]);
  // NOTE: hoveredBuildingId is deliberately excluded — handled in O(1) below

  // HOVER: update only the 1-2 changed instances (runs on every mouse move — O(1))
  useEffect(() => {
    const mesh = meshRef.current;
    const glow = glowRef.current;
    if (!mesh || !glow || buildings.length === 0) return;

    const emArr = (boxGeo.getAttribute('instanceEmissive') as THREE.InstancedBufferAttribute).array as Float32Array;
    let dirty = false;

    // Restore previous hovered instance to base colors
    const prev = prevHoveredIdx.current;
    if (prev >= 0 && prev < buildings.length) {
      _color.setRGB(baseColors.current[prev * 3], baseColors.current[prev * 3 + 1], baseColors.current[prev * 3 + 2]);
      mesh.setColorAt(prev, _color);
      emArr[prev * 3] = baseEmissives.current[prev * 3];
      emArr[prev * 3 + 1] = baseEmissives.current[prev * 3 + 1];
      emArr[prev * 3 + 2] = baseEmissives.current[prev * 3 + 2];
      _glowC.setRGB(baseGlowColors.current[prev * 3], baseGlowColors.current[prev * 3 + 1], baseGlowColors.current[prev * 3 + 2]);
      glow.setColorAt(prev, _glowC);
      targetScales.current[prev] = computeBaseScale(buildings[prev]);
      dirty = true;
    }

    // Apply hover effect to new instance
    if (hoveredBuildingId) {
      const idx = idToIndex.get(hoveredBuildingId);
      if (idx !== undefined) {
        const b = buildings[idx];
        // Brighten the base color for hover
        _color.setRGB(baseColors.current[idx * 3], baseColors.current[idx * 3 + 1], baseColors.current[idx * 3 + 2]);
        _color.multiplyScalar(1.3);
        mesh.setColorAt(idx, _color);
        _emissive.setRGB(baseEmissives.current[idx * 3], baseEmissives.current[idx * 3 + 1], baseEmissives.current[idx * 3 + 2]);
        _emissive.multiplyScalar(1.5);
        emArr[idx * 3] = _emissive.r;
        emArr[idx * 3 + 1] = _emissive.g;
        emArr[idx * 3 + 2] = _emissive.b;
        _glowC.setRGB(baseGlowColors.current[idx * 3], baseGlowColors.current[idx * 3 + 1], baseGlowColors.current[idx * 3 + 2]);
        _glowC.multiplyScalar(2.0);
        glow.setColorAt(idx, _glowC);
        targetScales.current[idx] = computeBaseScale(b) * 1.05;
        prevHoveredIdx.current = idx;
        dirty = true;
      }
    } else {
      prevHoveredIdx.current = -1;
    }

    if (dirty) {
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      if (glow.instanceColor) glow.instanceColor.needsUpdate = true;
      const emAttr = boxGeo.getAttribute('instanceEmissive') as THREE.BufferAttribute;
      if (emAttr) emAttr.needsUpdate = true;
    }
  }, [hoveredBuildingId, buildings, boxGeo, idToIndex]);

  // Helper: get the base target scale for a building (no hover)
  function computeBaseScale(b: BuildingData): number {
    const isSelected = selectedBuildingId === b.id;
    const isHighlighted = highlightedFileIds instanceof Set && highlightedFileIds.has(b.fileId);
    const isCritical = criticalFileIds instanceof Set && criticalFileIds.has(b.fileId);
    const isInsightsHL = insightsHighlightedFileIds instanceof Set && insightsHighlightedFileIds.has(b.fileId);

    if (isInCriticalPathMode) return isCritical ? 1.1 : 0.85;
    if (isInFindUsagesMode) return isHighlighted ? 1.08 : 0.9;
    if (isInInsightsMode) return isInsightsHL ? 1.08 : 0.9;
    return isSelected ? 1.1 : 1;
  }

  // Animation loop — only updates instances that need it
  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh || buildings.length === 0) return;

    let needsUpdate = false;
    const floating = floatingSet.current;

    for (let i = 0; i < buildings.length; i++) {
      const current = currentScales.current[i];
      const target = targetScales.current[i];
      const isFloating = floating.has(i);

      if (Math.abs(target - current) < 0.001 && !isFloating) continue;

      const newScale = THREE.MathUtils.lerp(current, target, delta * 8);
      currentScales.current[i] = newScale;

      const b = buildings[i];
      const [w, h, d] = b.dimensions;
      let yPos = b.position[1];

      if (isFloating) {
        const intensity = isInCriticalPathMode ? 0.15 : 0.1;
        const speed = isInCriticalPathMode ? 2.5 : 2;
        yPos += Math.sin(state.clock.elapsedTime * speed + i * 0.5) * intensity;
      }

      _mat.compose(
        _pos.set(b.position[0], yPos, b.position[2]),
        _quat.identity(),
        _scl.set(w * newScale, h * newScale, d * newScale)
      );
      mesh.setMatrixAt(i, _mat);
      needsUpdate = true;
    }

    if (needsUpdate) {
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  // Pointer handlers
  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined || e.instanceId >= buildings.length) return;
    const building = buildings[e.instanceId];
    hoverBuilding(building.id, building);
    document.body.style.cursor = 'pointer';
  }, [buildings, hoverBuilding]);

  const handlePointerOut = useCallback(() => {
    hoverBuilding(null, null);
    document.body.style.cursor = 'auto';
  }, [hoverBuilding]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined || e.instanceId >= buildings.length) return;
    const building = buildings[e.instanceId];
    selectBuilding(selectedBuildingId === building.id ? null : building.id);
  }, [buildings, selectBuilding, selectedBuildingId]);

  if (buildings.length === 0) return null;

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[boxGeo, buildingMaterial, buildings.length]}
        frustumCulled={false}
        castShadow
        receiveShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
      <instancedMesh
        ref={glowRef}
        args={[glowGeo, glowMaterial, buildings.length]}
        frustumCulled={false}
      />
    </group>
  );
}
