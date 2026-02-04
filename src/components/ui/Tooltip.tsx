'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore } from '@/stores/visualizationStore';
import { CATEGORY_COLORS } from '@/lib/mockData';

const HOVER_DELAY_MS = 400;

export function Tooltip() {
  const { hoveredBuilding, hoveredBuildingId } = useVisualizationStore();
  const findUsagesOpen = useVisualizationStore(state => state.findUsagesOpen);
  const codeEditorOpen = useVisualizationStore(state => state.codeEditorOpen);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBuildingId = useRef<string | null>(null);

  // Hide tooltip when modal panels are open
  const suppressTooltip = findUsagesOpen || codeEditorOpen;

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Delay showing tooltip
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!hoveredBuildingId || suppressTooltip) {
      setVisible(false);
      lastBuildingId.current = null;
      return;
    }

    // If same building, keep visible
    if (hoveredBuildingId === lastBuildingId.current) return;

    lastBuildingId.current = hoveredBuildingId;
    setVisible(false);
    timerRef.current = setTimeout(() => setVisible(true), HOVER_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [hoveredBuildingId, suppressTooltip]);

  if (!hoveredBuilding || !hoveredBuildingId || !visible || suppressTooltip) return null;

  const { metadata } = hoveredBuilding;
  const colors = CATEGORY_COLORS[metadata.category];

  const getComplexityLevel = (score: number) => {
    if (score < 30) return { label: 'Low', color: '#22c55e' };
    if (score < 60) return { label: 'Med', color: '#eab308' };
    return { label: 'High', color: '#ef4444' };
  };

  const complexity = getComplexityLevel(metadata.complexity);

  // Keep tooltip within viewport
  const tooltipX = Math.min(mousePosition.x + 16, window.innerWidth - 230);
  const tooltipY = Math.min(mousePosition.y - 8, window.innerHeight - 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        className="fixed z-[100] pointer-events-none"
        style={{ left: tooltipX, top: tooltipY }}
      >
        <div className="glass rounded-lg px-3 py-2 min-w-[180px] max-w-[220px] shadow-xl">
          <div className="text-xs font-medium text-white truncate">{metadata.name}</div>
          <div className="text-[10px] text-white/40 font-mono truncate mt-0.5">{metadata.path}</div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-white/50">{metadata.lineCount.toLocaleString()} lines</span>
            <span
              className="text-[10px] font-medium"
              style={{ color: complexity.color }}
            >
              {complexity.label}
            </span>
            <span
              className="text-[10px] capitalize"
              style={{ color: colors.emissive }}
            >
              {metadata.category}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
