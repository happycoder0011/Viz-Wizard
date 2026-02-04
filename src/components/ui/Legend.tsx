'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORY_COLORS } from '@/lib/mockData';
import { FileCategory } from '@/types/repository';
import { useVisualizationStore } from '@/stores/visualizationStore';

const LEGEND_ITEMS: { category: FileCategory; label: string; description: string }[] = [
  { category: 'core', label: 'Core Logic', description: 'TypeScript/TSX' },
  { category: 'legacy', label: 'Legacy', description: 'JavaScript' },
  { category: 'style', label: 'Styles', description: 'CSS/Assets' },
  { category: 'test', label: 'Tests', description: 'Test files' },
  { category: 'config', label: 'Config', description: 'JSON/YAML' },
  { category: 'docs', label: 'Docs', description: 'Markdown' },
];

export function Legend() {
  const { minimizedPanels, togglePanelMinimized } = useVisualizationStore();
  const criticalPathEnabled = useVisualizationStore(state => state.criticalPathEnabled);
  const isMinimized = minimizedPanels.legend;

  // Hide legend when critical path panel occupies same position
  if (criticalPathEnabled) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
    >
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.button
            key="minimized"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => togglePanelMinimized('legend')}
            className="glass rounded-xl px-3 py-2 flex items-center gap-2 hover:bg-white/10 transition-colors"
            title="Expand Legend"
          >
            <div className="flex items-center gap-1">
              {LEGEND_ITEMS.slice(0, 3).map((item) => {
                const colors = CATEGORY_COLORS[item.category];
                return (
                  <div
                    key={item.category}
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{
                      backgroundColor: colors.main,
                      boxShadow: `0 0 6px ${colors.emissive}40`,
                    }}
                  />
                );
              })}
              <span className="text-white/40 text-xs">...</span>
            </div>
            <span className="text-xs font-medium text-white/70">Legend</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass rounded-xl px-4 py-2"
          >
            <div className="flex items-center gap-4">
              {LEGEND_ITEMS.map((item) => {
                const colors = CATEGORY_COLORS[item.category];
                return (
                  <div
                    key={item.category}
                    className="flex items-center gap-2 group"
                    title={item.description}
                  >
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{
                        backgroundColor: colors.main,
                        boxShadow: `0 0 8px ${colors.emissive}40`,
                      }}
                    />
                    <span className="text-xs text-white/60 group-hover:text-white/90 transition-colors">
                      {item.label}
                    </span>
                  </div>
                );
              })}
              <button
                onClick={() => togglePanelMinimized('legend')}
                className="p-1 rounded hover:bg-white/10 transition-colors ml-2"
                title="Minimize"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
