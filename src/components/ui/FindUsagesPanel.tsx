'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore } from '@/stores/visualizationStore';
import { CATEGORY_COLORS } from '@/lib/mockData';
import { CONNECTION_STYLES } from '@/types/repository';
import { FileCategory, ConnectionType } from '@/types/repository';

// Connection type labels and icons
const CONNECTION_INFO: Record<ConnectionType, { label: string; icon: string; description: string }> = {
  import: {
    label: 'Import',
    icon: 'M12 3v18M3 12h18',
    description: 'ES module import',
  },
  call: {
    label: 'Function Call',
    icon: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z',
    description: 'Direct function/method call',
  },
  dataflow: {
    label: 'Data Flow',
    icon: 'M4 12h16M12 4l8 8-8 8',
    description: 'Data passing between modules',
  },
  extends: {
    label: 'Extends',
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    description: 'Class inheritance',
  },
  implements: {
    label: 'Implements',
    icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
    description: 'Interface implementation',
  },
  directory: {
    label: 'Directory',
    icon: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',
    description: 'Directory relationship',
  },
};

export function FindUsagesPanel() {
  const {
    findUsagesOpen,
    findUsagesFileId,
    findUsagesResults,
    repository,
    closeFindUsages,
    focusOnUsageFile,
    openCodeEditor,
  } = useVisualizationStore();

  if (!findUsagesOpen || !findUsagesFileId) return null;

  const sourceFile = repository?.allFiles.find(f => f.id === findUsagesFileId);
  if (!sourceFile) return null;

  const sourceColors = CATEGORY_COLORS[sourceFile.category as FileCategory];

  // Group results by direction
  const incomingResults = findUsagesResults.filter(r => r.direction === 'incoming');
  const outgoingResults = findUsagesResults.filter(r => r.direction === 'outgoing');

  return (
    <AnimatePresence>
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm"
        onClick={closeFindUsages}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, x: 50, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 50, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed top-4 right-4 bottom-4 z-[60] w-[420px] glass rounded-xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div
          className="px-4 py-3 border-b border-white/10 flex-shrink-0"
          style={{ backgroundColor: `${sourceColors.emissive}10` }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${sourceColors.emissive}20` }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={sourceColors.emissive}
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Find Usages</h2>
                <p className="text-[10px] text-white/50">
                  {findUsagesResults.length} reference{findUsagesResults.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
            <button
              onClick={closeFindUsages}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Source file info */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <div
              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${sourceColors.emissive}20` }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke={sourceColors.emissive}
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-medium text-white truncate">{sourceFile.name}</div>
              <div className="text-[10px] text-white/40 font-mono truncate">{sourceFile.path}</div>
            </div>
            <button
              onClick={() => openCodeEditor(sourceFile.id)}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              title="View Code"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Results - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {findUsagesResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="text-sm text-white/50">No usages found</p>
              <p className="text-xs text-white/30 mt-1">This file is not referenced by other files</p>
            </div>
          ) : (
            <>
              {/* Incoming (files that use this file) */}
              {incomingResults.length > 0 && (
                <ResultSection
                  title="Used by"
                  subtitle="Files that reference this file"
                  results={incomingResults}
                  onFocusFile={focusOnUsageFile}
                  onViewCode={openCodeEditor}
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                  }
                />
              )}

              {/* Outgoing (files this file uses) */}
              {outgoingResults.length > 0 && (
                <ResultSection
                  title="Uses"
                  subtitle="Files referenced by this file"
                  results={outgoingResults}
                  onFocusFile={focusOnUsageFile}
                  onViewCode={openCodeEditor}
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <polyline points="19 12 12 19 5 12" />
                    </svg>
                  }
                />
              )}
            </>
          )}
        </div>

        {/* Footer with summary */}
        <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40 flex-shrink-0">
          <span>{incomingResults.length} incoming, {outgoingResults.length} outgoing</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" title="Incoming" />
            <span className="w-2 h-2 rounded-full bg-blue-400" title="Outgoing" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Usage result type
interface UsageResult {
  fileId: string;
  fileName: string;
  filePath: string;
  category: string;
  connectionType: ConnectionType;
  direction: 'incoming' | 'outgoing';
  metadata?: {
    functionName?: string;
    variableName?: string;
    lineNumber?: number;
  };
}

// Result section component
interface ResultSectionProps {
  title: string;
  subtitle: string;
  results: UsageResult[];
  onFocusFile: (fileId: string) => void;
  onViewCode: (fileId: string) => void;
  icon: React.ReactNode;
}

function ResultSection({ title, subtitle, results, onFocusFile, onViewCode, icon }: ResultSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <div>
          <h3 className="text-xs font-semibold text-white">{title}</h3>
          <p className="text-[10px] text-white/40">{subtitle}</p>
        </div>
        <span className="ml-auto px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-white/60">
          {results.length}
        </span>
      </div>

      <div className="space-y-1">
        {results.map((result) => (
          <ResultItem
            key={`${result.fileId}-${result.connectionType}`}
            result={result}
            onFocus={() => onFocusFile(result.fileId)}
            onViewCode={() => onViewCode(result.fileId)}
          />
        ))}
      </div>
    </div>
  );
}

// Individual result item
interface ResultItemProps {
  result: UsageResult;
  onFocus: () => void;
  onViewCode: () => void;
}

function ResultItem({ result, onFocus, onViewCode }: ResultItemProps) {
  const colors = CATEGORY_COLORS[result.category as FileCategory];
  const connectionStyle = CONNECTION_STYLES[result.connectionType];
  const connectionInfo = CONNECTION_INFO[result.connectionType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
    >
      <div className="flex items-start gap-2">
        {/* File icon */}
        <div
          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: `${colors.emissive}20` }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.emissive}
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>

        {/* File info */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white truncate">{result.fileName}</span>
            {/* Connection type badge */}
            <span
              className="px-1 py-0.5 rounded text-[8px] font-medium flex-shrink-0"
              style={{
                backgroundColor: `${connectionStyle.color}20`,
                color: connectionStyle.color,
              }}
            >
              {connectionInfo.label}
            </span>
          </div>
          <div className="text-[10px] text-white/40 font-mono truncate">{result.filePath}</div>

          {/* Metadata */}
          {result.metadata && (
            <div className="mt-1 flex items-center gap-2 text-[10px]">
              {result.metadata.functionName && (
                <span className="text-green-400/80">
                  fn: {result.metadata.functionName}()
                </span>
              )}
              {result.metadata.variableName && (
                <span className="text-purple-400/80">
                  var: {result.metadata.variableName}
                </span>
              )}
              {result.metadata.lineNumber && (
                <span className="text-white/40">
                  L{result.metadata.lineNumber}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onFocus}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title="Focus in 3D view"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
          <button
            onClick={onViewCode}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title="View Code"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50">
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

export default FindUsagesPanel;
