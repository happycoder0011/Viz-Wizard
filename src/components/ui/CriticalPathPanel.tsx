'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore } from '@/stores/visualizationStore';
import { getRiskLevel, getRiskColor } from '@/lib/criticalPath';
import { CATEGORY_COLORS } from '@/lib/mockData';
import { FileCategory } from '@/types/repository';

export function CriticalPathPanel() {
  const {
    criticalPathEnabled,
    criticalFiles,
    focusOnCriticalFile,
    openCodeEditor,
    repository,
    gitHistoryData,
    gitHistoryLoading,
    loadGitHistory,
  } = useVisualizationStore();

  if (!criticalPathEnabled || criticalFiles.length === 0) return null;

  const hasRealVelocityData = !!gitHistoryData;

  const handleLoadGitHistory = () => {
    if (repository?.owner && repository?.name) {
      loadGitHistory(repository.owner, repository.name);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-5xl w-full px-4"
      >
        <div className="glass rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-2 bg-gradient-to-r from-amber-500/10 to-red-500/10 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffd700"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Critical Path Radar</h3>
                <p className="text-[10px] text-white/50">
                  Top {criticalFiles.length} high-risk files
                  {hasRealVelocityData && (
                    <span className="ml-1 text-green-400">• Using git history</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Git History Button */}
              {!hasRealVelocityData && repository?.owner && (
                <button
                  onClick={handleLoadGitHistory}
                  disabled={gitHistoryLoading}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-[10px] text-white/70 hover:text-white disabled:opacity-50"
                >
                  {gitHistoryLoading ? (
                    <>
                      <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
                      </svg>
                      Load Git History
                    </>
                  )}
                </button>
              )}
              {/* Legend */}
              <div className="flex items-center gap-3 text-[10px] text-white/40">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Critical</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>High</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span>Medium</span>
                </div>
              </div>
            </div>
          </div>

          {/* File Cards - Horizontal Scroll */}
          <div className="p-3 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {criticalFiles.map((file, index) => (
                <CriticalFileCard
                  key={file.fileId}
                  file={file}
                  rank={index + 1}
                  onFocus={() => focusOnCriticalFile(file.fileId)}
                  onViewCode={() => openCodeEditor(file.fileId)}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

interface CriticalFileCardProps {
  file: {
    fileId: string;
    fileName: string;
    filePath: string;
    category: string;
    couplingScore: number;
    complexityScore: number;
    velocityScore: number;
    coverageScore: number;
    overallRisk: number;
    factors: string[];
  };
  rank: number;
  onFocus: () => void;
  onViewCode: () => void;
}

function CriticalFileCard({ file, rank, onFocus, onViewCode }: CriticalFileCardProps) {
  const riskLevel = getRiskLevel(file.overallRisk);
  const riskColor = getRiskColor(file.overallRisk);
  const categoryColors = CATEGORY_COLORS[file.category as FileCategory] || CATEGORY_COLORS.core;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: rank * 0.05 }}
      className="group relative w-48 flex-shrink-0"
    >
      <div
        className="p-3 rounded-lg border transition-all cursor-pointer hover:scale-105"
        style={{
          backgroundColor: `${riskColor}10`,
          borderColor: `${riskColor}30`,
        }}
        onClick={onFocus}
      >
        {/* Rank badge */}
        <div
          className="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{
            backgroundColor: riskColor,
            color: file.overallRisk >= 50 ? '#000' : '#fff',
          }}
        >
          {rank}
        </div>

        {/* File info */}
        <div className="flex items-start gap-2 mb-2">
          <div
            className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${categoryColors.emissive}20` }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke={categoryColors.emissive}
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-xs font-medium text-white truncate">{file.fileName}</div>
            <div className="text-[9px] text-white/40 font-mono truncate">{file.filePath}</div>
          </div>
        </div>

        {/* Risk score */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-lg font-bold"
            style={{ color: riskColor }}
          >
            {file.overallRisk}
          </span>
          <span
            className="text-[9px] font-medium px-1.5 py-0.5 rounded uppercase"
            style={{
              backgroundColor: `${riskColor}20`,
              color: riskColor,
            }}
          >
            {riskLevel}
          </span>
        </div>

        {/* Mini score bars */}
        <div className="space-y-1">
          <ScoreBar label="Coupling" value={file.couplingScore} color="#00ffff" />
          <ScoreBar label="Complexity" value={file.complexityScore} color="#ff66ff" />
          <ScoreBar label="Velocity" value={file.velocityScore} color="#66ff66" />
          <ScoreBar label="Coverage" value={file.coverageScore} color="#ff6666" inverted />
        </div>

        {/* Top factor */}
        {file.factors.length > 0 && (
          <div className="mt-2 text-[9px] text-white/50 truncate">
            {file.factors[0]}
          </div>
        )}

        {/* Hover actions */}
        <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewCode();
            }}
            className="p-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
            title="View Code"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface ScoreBarProps {
  label: string;
  value: number;
  color: string;
  inverted?: boolean;
}

function ScoreBar({ label, value, color, inverted }: ScoreBarProps) {
  // For "inverted" scores like coverage, high value = bad (red)
  const displayValue = inverted ? value : value;

  return (
    <div className="flex items-center gap-1">
      <span className="text-[8px] text-white/40 w-14 truncate">{label}</span>
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${displayValue}%`,
            backgroundColor: color,
            opacity: 0.7,
          }}
        />
      </div>
      <span className="text-[8px] text-white/50 w-6 text-right">{value}</span>
    </div>
  );
}

export default CriticalPathPanel;
