'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore } from '@/stores/visualizationStore';

export function Breadcrumbs() {
  const { breadcrumbs, navigateTo, navigateToRoot, repository } = useVisualizationStore();

  if (!repository) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-20 left-4 z-40"
    >
      <div className="glass rounded-lg px-3 py-2 flex items-center gap-1 text-sm">
        {/* Root */}
        <button
          onClick={navigateToRoot}
          className={`px-2 py-1 rounded transition-colors flex items-center gap-1.5
                     ${breadcrumbs.length === 0
                       ? 'text-viz-cyan'
                       : 'text-white/60 hover:text-white hover:bg-white/10'
                     }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="font-medium">{repository.owner}/{repository.name}</span>
        </button>

        {/* Breadcrumb items */}
        <AnimatePresence mode="popLayout">
          {breadcrumbs.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center"
            >
              <ChevronRight />
              <button
                onClick={() => navigateTo(item)}
                className={`px-2 py-1 rounded transition-colors
                           ${index === breadcrumbs.length - 1
                             ? 'text-viz-cyan font-medium'
                             : 'text-white/60 hover:text-white hover:bg-white/10'
                           }`}
              >
                {item.name}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-white/30"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
