'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore } from '@/stores/visualizationStore';
import { CATEGORY_COLORS } from '@/lib/mockData';

export function Tooltip() {
  const { hoveredBuilding, hoveredBuildingId } = useVisualizationStore();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!hoveredBuilding || !hoveredBuildingId) return null;

  const { metadata } = hoveredBuilding;
  const colors = CATEGORY_COLORS[metadata.category];

  // Calculate complexity level
  const getComplexityLevel = (score: number) => {
    if (score < 30) return { label: 'Low', color: 'text-green-400' };
    if (score < 60) return { label: 'Medium', color: 'text-yellow-400' };
    return { label: 'High', color: 'text-red-400' };
  };

  const complexity = getComplexityLevel(metadata.complexity);

  // Position the tooltip
  const tooltipX = mousePosition.x + 20;
  const tooltipY = mousePosition.y - 10;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="fixed z-[100] pointer-events-none tooltip-container"
        style={{
          left: tooltipX,
          top: tooltipY,
        }}
      >
        <div className="glass rounded-xl p-4 min-w-[280px] max-w-[350px] shadow-2xl">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            {/* File icon with category color */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: `${colors.emissive}20`,
                border: `1px solid ${colors.emissive}40`,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                style={{ color: colors.emissive }}
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="14 2 14 8 20 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium text-sm truncate">
                {metadata.name}
              </h3>
              <p className="text-white/50 text-xs truncate font-mono">
                {metadata.path}
              </p>
            </div>
          </div>

          {/* Complexity bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/60">Complexity</span>
              <span className={`text-xs font-medium ${complexity.color}`}>
                {complexity.label}
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metadata.complexity}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  backgroundColor: colors.emissive,
                  boxShadow: `0 0 10px ${colors.emissive}`,
                }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-lg p-2">
              <div className="text-xs text-white/50 mb-0.5">Lines of Code</div>
              <div className="text-sm font-medium text-white">
                {metadata.lineCount.toLocaleString()}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <div className="text-xs text-white/50 mb-0.5">Category</div>
              <div
                className="text-sm font-medium capitalize"
                style={{ color: colors.emissive }}
              >
                {metadata.category}
              </div>
            </div>
          </div>

          {/* Hint */}
          <div className="mt-3 pt-3 border-t border-white/10 text-center">
            <span className="text-xs text-white/40">Click to focus</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
