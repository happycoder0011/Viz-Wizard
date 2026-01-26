'use client';

import { motion } from 'framer-motion';
import { useVisualizationStore } from '@/stores/visualizationStore';

export function Header() {
  const { repository, cityData, criticalPathEnabled, toggleCriticalPath, showDistrictView } = useVisualizationStore();

  const stats = repository?.stats;
  const repoName = repository ? `${repository.owner}/${repository.name}` : 'Loading...';

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 p-4"
    >
      <div className="flex items-start justify-between">
        {/* Logo and repo info */}
        <div className="glass rounded-xl p-4 max-w-md">
          <div className="flex items-center gap-3 mb-3">
            {/* Logo */}
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-viz-cyan/20 to-viz-purple/20 flex items-center justify-center border border-viz-cyan/30">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-viz-cyan"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-sm font-semibold text-white/90">Viz-Wizard</h1>
              <p className="text-xs text-white/50">Codebase Visualization</p>
            </div>
          </div>

          {/* Repository name */}
          <div className="flex items-center gap-2 mb-3">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="text-white/40"
            >
              <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z" />
            </svg>
            <span className="text-white/80 font-mono text-sm">{repoName}</span>
          </div>

          {/* Stats */}
          {stats && (
            <div className="flex items-center gap-4 text-xs text-white/50">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-viz-cyan" />
                <span>{stats.totalFiles} files</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-viz-amber" />
                <span>{stats.totalLines.toLocaleString()} lines</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-viz-purple" />
                <span>{stats.totalDirectories} dirs</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* District View Button */}
          <motion.button
            onClick={showDistrictView}
            className="glass rounded-xl px-4 py-3 flex items-center gap-3 transition-all hover:bg-white/10"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-viz-cyan/20">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-viz-cyan"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-white/80">
                District View
              </div>
              <div className="text-[10px] text-white/40">
                See all clusters
              </div>
            </div>
          </motion.button>

          {/* Critical Path Button */}
          <motion.button
            onClick={toggleCriticalPath}
            className={`glass rounded-xl px-4 py-3 flex items-center gap-3 transition-all ${
              criticalPathEnabled
                ? 'bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/40'
                : 'hover:bg-white/10'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              criticalPathEnabled
                ? 'bg-amber-500/30'
                : 'bg-white/10'
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={criticalPathEnabled ? '#ffd700' : 'currentColor'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={criticalPathEnabled ? '' : 'text-white/60'}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="text-left">
            <div className={`text-sm font-medium ${criticalPathEnabled ? 'text-amber-400' : 'text-white/80'}`}>
              Critical Path
            </div>
            <div className="text-[10px] text-white/40">
              {criticalPathEnabled ? 'Showing high-risk files' : 'Find risky files'}
            </div>
          </div>
          {criticalPathEnabled && (
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </motion.button>
        </div>

        {/* Controls hint */}
        <div className="glass rounded-xl p-3 text-xs text-white/50">
          <div className="flex items-center gap-2 mb-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono">Drag</kbd>
            <span>Rotate</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono">Scroll</kbd>
            <span>Zoom</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono">Click</kbd>
            <span>Select</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
