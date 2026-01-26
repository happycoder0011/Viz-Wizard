'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore, FixtureType } from '@/stores/visualizationStore';
import { CONNECTION_STYLES, ConnectionType } from '@/types/repository';

const FIXTURE_OPTIONS: { value: FixtureType; label: string; description: string }[] = [
  { value: 'small', label: 'Small', description: '~20 files - Startup MVP' },
  { value: 'medium', label: 'Medium', description: '~100 files - SaaS App' },
  { value: 'large', label: 'Large', description: '~500 files - Monorepo' },
  { value: 'edge-cases', label: 'Edge Cases', description: 'God files, orphans' },
  { value: 'temporal', label: 'Temporal', description: 'With commit history' },
  { value: 'contributor', label: 'Contributors', description: 'Team ownership' },
];

// Connection type config for filters
const CONNECTION_TYPE_CONFIG: { type: ConnectionType; label: string }[] = [
  { type: 'import', label: 'Imports' },
  { type: 'call', label: 'Calls' },
  { type: 'dataflow', label: 'Data Flow' },
  { type: 'extends', label: 'Extends' },
  { type: 'implements', label: 'Implements' },
];

export function ControlPanel() {
  const {
    showConnections,
    showLabels,
    bloomIntensity,
    toggleConnections,
    toggleLabels,
    setBloomIntensity,
    resetCamera,
    selectedBuildingId,
    selectBuilding,
    currentFixture,
    loadFixture,
    isLoading,
    minimizedPanels,
    togglePanelMinimized,
    connectionFilters,
    toggleConnectionFilter,
    setAllConnectionFilters,
  } = useVisualizationStore();

  const isMinimized = minimizedPanels.controlPanel;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.button
            key="minimized"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => togglePanelMinimized('controlPanel')}
            className="glass rounded-xl p-3 flex items-center gap-2 hover:bg-white/10 transition-colors"
            title="Expand Controls"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-viz-cyan">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="text-xs font-medium text-white/70">Controls</span>
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
            className="glass rounded-xl p-4 space-y-4 w-64"
          >
            {/* Header with minimize button */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Test Dataset
              </h3>
              <button
                onClick={() => togglePanelMinimized('controlPanel')}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                title="Minimize"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>

            {/* Fixture Selector */}
            <div className="space-y-2">
              <select
                value={currentFixture}
                onChange={(e) => loadFixture(e.target.value as FixtureType)}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10
                           text-sm text-white/90 cursor-pointer
                           focus:outline-none focus:border-viz-cyan/50 focus:ring-1 focus:ring-viz-cyan/30
                           disabled:opacity-50 disabled:cursor-not-allowed
                           [&>option]:bg-viz-bg [&>option]:text-white"
              >
                {FIXTURE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">
                View Controls
              </h3>
            </div>

            {/* Toggle buttons */}
            <div className="space-y-2">
              <ToggleButton
                label="Connections"
                enabled={showConnections}
                onToggle={toggleConnections}
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="5" cy="12" r="3" />
                    <circle cx="19" cy="12" r="3" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                }
              />

              <ToggleButton
                label="Labels"
                enabled={showLabels}
                onToggle={toggleLabels}
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 7V4h16v3" />
                    <path d="M9 20h6" />
                    <path d="M12 4v16" />
                  </svg>
                }
              />
            </div>

            {/* Connection Type Filters */}
            {showConnections && (
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                    Connection Types
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setAllConnectionFilters(true)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-colors"
                    >
                      All
                    </button>
                    <button
                      onClick={() => setAllConnectionFilters(false)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-colors"
                    >
                      None
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {CONNECTION_TYPE_CONFIG.map(({ type, label }) => {
                    const style = CONNECTION_STYLES[type];
                    const isEnabled = connectionFilters[type as keyof typeof connectionFilters];

                    return (
                      <button
                        key={type}
                        onClick={() => toggleConnectionFilter(type)}
                        className={`w-full px-2 py-1.5 rounded-lg flex items-center gap-2 transition-all
                          ${isEnabled
                            ? 'bg-white/5 border border-white/10'
                            : 'bg-transparent border border-transparent opacity-50'
                          }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: style.color,
                            boxShadow: isEnabled ? `0 0 6px ${style.color}` : 'none',
                          }}
                        />
                        <span className="text-[11px] text-white/70 flex-1 text-left">{label}</span>
                        <span
                          className="text-[9px] px-1 py-0.5 rounded"
                          style={{
                            backgroundColor: `${style.color}20`,
                            color: style.color,
                          }}
                        >
                          {style.pattern}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bloom intensity slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Glow Intensity</span>
                <span className="text-xs text-white/40 font-mono">
                  {bloomIntensity.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={bloomIntensity}
                onChange={(e) => setBloomIntensity(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-3
                           [&::-webkit-slider-thumb]:h-3
                           [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-viz-cyan
                           [&::-webkit-slider-thumb]:shadow-[0_0_10px_var(--viz-cyan)]
                           [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <button
                onClick={resetCamera}
                className="w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10
                           text-xs text-white/70 hover:text-white transition-colors
                           flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Reset Camera
              </button>

              {selectedBuildingId && (
                <button
                  onClick={() => selectBuilding(null)}
                  className="w-full px-3 py-2 rounded-lg bg-viz-cyan/10 hover:bg-viz-cyan/20
                             text-xs text-viz-cyan transition-colors
                             flex items-center justify-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Deselect Building
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Toggle button component
interface ToggleButtonProps {
  label: string;
  enabled: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
}

function ToggleButton({ label, enabled, onToggle, icon }: ToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 transition-all
                  ${enabled
                    ? 'bg-viz-cyan/10 text-viz-cyan border border-viz-cyan/30'
                    : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'
                  }`}
    >
      <span className="opacity-70">{icon}</span>
      <span className="text-xs flex-1 text-left">{label}</span>
      <div
        className={`w-8 h-4 rounded-full relative transition-colors
                    ${enabled ? 'bg-viz-cyan/30' : 'bg-white/10'}`}
      >
        <motion.div
          animate={{ x: enabled ? 16 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full
                      ${enabled ? 'bg-viz-cyan shadow-[0_0_8px_var(--viz-cyan)]' : 'bg-white/50'}`}
        />
      </div>
    </button>
  );
}
