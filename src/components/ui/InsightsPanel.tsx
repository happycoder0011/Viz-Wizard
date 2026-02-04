'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore } from '@/stores/visualizationStore';
import type { InsightFinding, ModuleBreakdown, StartHereEntry, HealthFactor } from '@/lib/insightsEngine';

const GRADE_COLORS: Record<string, string> = {
  A: '#00ff88',
  B: '#00ffff',
  C: '#ffaa00',
  D: '#ff8800',
  F: '#ff4466',
};

const GRADE_LABELS: Record<string, string> = {
  A: 'Excellent',
  B: 'Healthy',
  C: 'Fair',
  D: 'Needs Work',
  F: 'Critical',
};

const SEVERITY_CONFIG = {
  critical: { color: '#ff4466', bg: 'bg-red-500/10', border: 'border-red-500/30', label: '!!' },
  warning: { color: '#ffaa00', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: '!' },
  info: { color: '#00ffff', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', label: 'i' },
};

function FindingCard({
  finding,
  onShowMe,
}: {
  finding: InsightFinding;
  onShowMe: () => void;
}) {
  const config = SEVERITY_CONFIG[finding.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-lg ${config.bg} border ${config.border} group cursor-pointer hover:bg-white/5 transition-colors`}
      onClick={onShowMe}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
            style={{ backgroundColor: `${config.color}30`, color: config.color }}
          >
            {config.label}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white/90">{finding.title}</div>
            <div className="text-[10px] text-white/50 mt-0.5 leading-relaxed">{finding.description}</div>
            {finding.metric && (
              <span
                className="text-[9px] font-mono mt-1.5 inline-block px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${config.color}15`, color: config.color }}
              >
                {finding.metric}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowMe();
          }}
          className="px-2 py-1 rounded-md text-[10px] font-medium transition-all flex-shrink-0
                     bg-white/5 hover:bg-white/15 text-white/50 hover:text-white
                     opacity-60 group-hover:opacity-100"
        >
          Show me
        </button>
      </div>
    </motion.div>
  );
}

function HealthBar({ factor }: { factor: HealthFactor }) {
  const healthPercent = 100 - factor.score;
  const barColor = healthPercent >= 70 ? '#00ff88' : healthPercent >= 45 ? '#ffaa00' : '#ff4466';

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-white/40 w-20 flex-shrink-0">{factor.label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${healthPercent}%`, backgroundColor: barColor }}
        />
      </div>
      <span className="text-[10px] text-white/30 w-8 text-right">{Math.round(healthPercent)}</span>
    </div>
  );
}

function ModuleRow({
  module,
  onShowMe,
}: {
  module: ModuleBreakdown;
  onShowMe: () => void;
}) {
  const indicatorColors = {
    good: { bg: '#00ff8820', text: '#00ff88' },
    fair: { bg: '#ffaa0020', text: '#ffaa00' },
    poor: { bg: '#ff446620', text: '#ff4466' },
  };
  const colors = indicatorColors[module.healthIndicator];

  return (
    <button
      onClick={onShowMe}
      className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] transition-colors group"
    >
      <div className="flex items-center gap-2 min-w-0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30 flex-shrink-0">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <span className="text-xs text-white/70 truncate">{module.name}/</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] text-white/40">{module.fileCount} files</span>
        <span
          className="px-1.5 py-0.5 rounded text-[9px] font-medium"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {module.healthIndicator}
        </span>
      </div>
    </button>
  );
}

function StartHereRow({
  entry,
  rank,
  onGo,
}: {
  entry: StartHereEntry;
  rank: number;
  onGo: () => void;
}) {
  return (
    <button
      onClick={onGo}
      className="w-full flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] transition-colors group"
    >
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
        style={{ backgroundColor: '#00ffff15', color: '#00ffff' }}
      >
        {rank}
      </span>
      <div className="flex-1 min-w-0 text-left">
        <div className="text-xs text-white/70 truncate">{entry.fileName}</div>
        <div className="text-[9px] text-white/40 truncate">{entry.filePath}</div>
      </div>
      <span className="text-[9px] text-white/30 flex-shrink-0">{entry.dependentCount} deps</span>
    </button>
  );
}

export function InsightsPanel() {
  const insights = useVisualizationStore(state => state.codebaseInsights);
  const isOpen = useVisualizationStore(state => state.insightsPanelOpen);
  const togglePanel = useVisualizationStore(state => state.toggleInsightsPanel);
  const showInsightInView = useVisualizationStore(state => state.showInsightInView);

  const [modulesExpanded, setModulesExpanded] = useState(false);

  if (!insights) return null;

  const gradeColor = GRADE_COLORS[insights.healthGrade] ?? '#00ffff';
  const gradeLabel = GRADE_LABELS[insights.healthGrade] ?? '';

  // Collapsed state — small pill
  if (!isOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={togglePanel}
        className="fixed top-[200px] left-4 z-40 glass rounded-xl p-3 flex items-center gap-2 hover:bg-white/10 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border"
          style={{ color: gradeColor, borderColor: gradeColor, backgroundColor: `${gradeColor}15` }}
        >
          {insights.healthGrade}
        </div>
        <span className="text-xs text-white/60">Insights</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </motion.button>
    );
  }

  const modulesToShow = modulesExpanded ? insights.modules : insights.modules.slice(0, 4);
  const hasMoreModules = insights.modules.length > 4;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="fixed top-[200px] left-4 z-40 w-[300px] glass rounded-xl overflow-hidden"
    >
      <div className="max-h-[calc(100vh-360px)] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ffff" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span className="text-xs font-semibold text-white/80">Codebase Insights</span>
          </div>
          <button
            onClick={togglePanel}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        </div>

        {/* Health Grade Hero */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-4 mb-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-2 flex-shrink-0"
              style={{
                color: gradeColor,
                borderColor: gradeColor,
                backgroundColor: `${gradeColor}15`,
                boxShadow: `0 0 24px ${gradeColor}25`,
              }}
            >
              {insights.healthGrade}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white/90">
                {gradeLabel}
                <span className="text-white/40 font-normal ml-1.5">{insights.healthScore}/100</span>
              </div>
              <div className="text-[11px] text-white/50 leading-relaxed mt-0.5">{insights.summary}</div>
            </div>
          </div>

          {/* Health Factor Bars */}
          <div className="space-y-1.5">
            {insights.healthFactors.map(factor => (
              <HealthBar key={factor.label} factor={factor} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/5 mx-4" />

        {/* Findings */}
        {insights.findings.length > 0 && (
          <div className="px-4 py-3">
            <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">
              Top Findings
            </div>
            <div className="space-y-2">
              {insights.findings.map(finding => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  onShowMe={() => showInsightInView(finding.fileIds)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-white/5 mx-4" />

        {/* Modules */}
        {insights.modules.length > 0 && (
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                Modules
              </span>
              {hasMoreModules && (
                <button
                  onClick={() => setModulesExpanded(!modulesExpanded)}
                  className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                >
                  {modulesExpanded ? 'Show less' : `+${insights.modules.length - 4} more`}
                </button>
              )}
            </div>
            <div className="space-y-1">
              {modulesToShow.map(mod => (
                <ModuleRow
                  key={mod.name}
                  module={mod}
                  onShowMe={() => showInsightInView(mod.fileIds)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-white/5 mx-4" />

        {/* Start Here */}
        {insights.startHere.length > 0 && (
          <div className="px-4 py-3 pb-4">
            <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">
              Start Here
            </div>
            <div className="space-y-1">
              {insights.startHere.map((entry, i) => (
                <StartHereRow
                  key={entry.fileId}
                  entry={entry}
                  rank={i + 1}
                  onGo={() => showInsightInView([entry.fileId])}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default InsightsPanel;
