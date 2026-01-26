'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore } from '@/stores/visualizationStore';
import { ZOOM_LEVELS, ZoomLevel } from '@/types/repository';

const ZOOM_LEVEL_ICONS: Record<ZoomLevel, React.ReactNode> = {
  satellite: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  regional: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  district: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18" />
      <path d="M5 21V7l8-4v18" />
      <path d="M19 21V11l-6-4" />
      <path d="M9 9v.01" />
      <path d="M9 12v.01" />
      <path d="M9 15v.01" />
    </svg>
  ),
  street: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
};

export function ZoomIndicator() {
  const { currentZoomLevel, cameraDistance, minimizedPanels, togglePanelMinimized, selectedBuildingId } = useVisualizationStore();
  const isMinimized = minimizedPanels.zoomIndicator;

  const currentConfig = ZOOM_LEVELS.find(l => l.level === currentZoomLevel);

  // Position higher up when SelectedBuildingPanel might be visible
  const bottomOffset = selectedBuildingId && !minimizedPanels.selectedBuilding ? 'bottom-[340px]' : 'bottom-4';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`fixed ${bottomOffset} left-4 z-50`}
    >
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.button
            key="minimized"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => togglePanelMinimized('zoomIndicator')}
            className="glass rounded-xl p-3 flex items-center gap-2 hover:bg-white/10 transition-colors"
            title="Expand Zoom Level"
          >
            <span className="text-viz-cyan">
              {ZOOM_LEVEL_ICONS[currentZoomLevel]}
            </span>
            <span className="text-xs font-medium text-white/70">{currentConfig?.label}</span>
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
            className="glass rounded-xl p-3 space-y-3 w-48"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Zoom Level
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40 font-mono">
                  {cameraDistance.toFixed(0)}m
                </span>
                <button
                  onClick={() => togglePanelMinimized('zoomIndicator')}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                  title="Minimize"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Zoom level indicator */}
            <div className="space-y-1.5">
              {ZOOM_LEVELS.slice().reverse().map((level) => {
                const isActive = level.level === currentZoomLevel;
                return (
                  <div
                    key={level.level}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all
                               ${isActive
                                 ? 'bg-viz-cyan/20 border border-viz-cyan/40'
                                 : 'bg-white/5 border border-transparent'
                               }`}
                  >
                    <span className={isActive ? 'text-viz-cyan' : 'text-white/40'}>
                      {ZOOM_LEVEL_ICONS[level.level]}
                    </span>
                    <div className="flex-1">
                      <div className={`text-xs font-medium ${isActive ? 'text-viz-cyan' : 'text-white/50'}`}>
                        {level.label}
                      </div>
                      <div className="text-[10px] text-white/30">
                        {level.description}
                      </div>
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="zoom-indicator"
                        className="w-1.5 h-1.5 rounded-full bg-viz-cyan shadow-[0_0_8px_var(--viz-cyan)]"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Zoom hint */}
            <div className="text-[10px] text-white/30 text-center pt-1 border-t border-white/10">
              Scroll to zoom in/out
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
