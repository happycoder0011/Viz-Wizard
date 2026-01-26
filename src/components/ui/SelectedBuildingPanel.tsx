'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore } from '@/stores/visualizationStore';
import { CATEGORY_COLORS } from '@/lib/mockData';

export function SelectedBuildingPanel() {
  const { selectedBuildingId, cityData, selectBuilding, minimizedPanels, togglePanelMinimized, openCodeEditor, openFindUsages } = useVisualizationStore();
  const isMinimized = minimizedPanels.selectedBuilding;

  // Find the selected building
  let selectedBuilding = null;
  if (selectedBuildingId && cityData) {
    for (const district of cityData.districts) {
      const building = district.buildings.find(b => b.id === selectedBuildingId);
      if (building) {
        selectedBuilding = building;
        break;
      }
    }
  }

  if (!selectedBuilding) return null;

  const { metadata } = selectedBuilding;
  const colors = CATEGORY_COLORS[metadata.category];

  // Complexity indicator
  const getComplexityInfo = (score: number) => {
    if (score < 30) return { label: 'Low', color: 'text-green-400', bg: 'bg-green-400/10' };
    if (score < 60) return { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
    return { label: 'High', color: 'text-red-400', bg: 'bg-red-400/10' };
  };

  const complexity = getComplexityInfo(metadata.complexity);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-4 left-4 z-50 max-w-sm"
      >
        <AnimatePresence mode="wait">
          {isMinimized ? (
            <motion.button
              key="minimized"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => togglePanelMinimized('selectedBuilding')}
              className="glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors"
              title="Expand File Details"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${colors.emissive}20` }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ color: colors.emissive }}
                >
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-white truncate max-w-[150px]">{metadata.name}</div>
                <div className="text-xs text-white/50">{metadata.lineCount.toLocaleString()} lines</div>
              </div>
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
              className="glass rounded-xl overflow-hidden"
            >
              {/* Header with close button */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: `${colors.emissive}10` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${colors.emissive}20` }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ color: colors.emissive }}
                    >
                      <path
                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">{metadata.name}</h3>
                    <p className="text-xs text-white/50 font-mono">{metadata.path}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => togglePanelMinimized('selectedBuilding')}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    title="Minimize"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <button
                    onClick={() => selectBuilding(null)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    title="Close"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2">
                  <StatCard
                    label="Lines"
                    value={metadata.lineCount.toLocaleString()}
                    color={colors.emissive}
                  />
                  <StatCard
                    label="Category"
                    value={metadata.category}
                    color={colors.emissive}
                    capitalize
                  />
                  <StatCard
                    label="Complexity"
                    value={complexity.label}
                    className={complexity.color}
                  />
                </div>

                {/* Complexity bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/60">Complexity Score</span>
                    <span className="text-xs font-mono text-white/80">{metadata.complexity}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metadata.complexity}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: colors.emissive,
                        boxShadow: `0 0 10px ${colors.emissive}`,
                      }}
                    />
                  </div>
                </div>

                {/* Category badge */}
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-1 rounded-md text-xs font-medium"
                    style={{
                      backgroundColor: `${colors.emissive}15`,
                      color: colors.emissive,
                      border: `1px solid ${colors.emissive}30`,
                    }}
                  >
                    {getCategoryDescription(metadata.category)}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => openCodeEditor(selectedBuilding.fileId)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    View Code
                  </button>
                  <button
                    onClick={() => openFindUsages(selectedBuilding.fileId)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Find Usages
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

// Stat card component
interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
  className?: string;
  capitalize?: boolean;
}

function StatCard({ label, value, color, className, capitalize }: StatCardProps) {
  return (
    <div className="bg-white/5 rounded-lg p-2 text-center">
      <div className="text-[10px] text-white/50 mb-0.5">{label}</div>
      <div
        className={`text-sm font-medium ${capitalize ? 'capitalize' : ''} ${className || 'text-white'}`}
        style={color && !className ? { color } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

// Get human-readable category description
function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    core: 'Core Logic',
    legacy: 'Legacy Code',
    style: 'Styling',
    test: 'Test File',
    config: 'Configuration',
    docs: 'Documentation',
  };
  return descriptions[category] || category;
}
