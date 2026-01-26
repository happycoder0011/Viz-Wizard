'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore } from '@/stores/visualizationStore';
import { CONNECTION_STYLES, ConnectionType } from '@/types/repository';

// Get human-readable connection type name
function getConnectionTypeName(type: ConnectionType): string {
  const names: Record<ConnectionType, string> = {
    import: 'Import',
    directory: 'Directory',
    call: 'Function Call',
    dataflow: 'Data Flow',
    extends: 'Extends',
    implements: 'Implements',
  };
  return names[type] || type;
}

// Get icon for connection type
function getConnectionIcon(type: ConnectionType): string {
  const icons: Record<ConnectionType, string> = {
    import: 'M4 17l6-6-6-6 M12 17l6-6-6-6',
    directory: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
    call: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72',
    dataflow: 'M12 2v20 M2 12h20 M7 7l5 5 5-5 M7 17l5-5 5 5',
    extends: 'M12 2l10 6.5v7L12 22 2 15.5v-7L12 2z',
    implements: 'M12 2l10 6.5v7L12 22 2 15.5v-7L12 2z M12 8v8',
  };
  return icons[type] || icons.import;
}

export function ConnectionTooltip() {
  const { hoveredConnection, repository } = useVisualizationStore();

  if (!hoveredConnection || !repository) return null;

  const style = CONNECTION_STYLES[hoveredConnection.connectionType];
  const sourceFile = repository.allFiles.find(f => f.id === hoveredConnection.sourceFileId);
  const targetFile = repository.allFiles.find(f => f.id === hoveredConnection.targetFileId);

  if (!sourceFile || !targetFile) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        transition={{ duration: 0.15 }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
      >
        <div className="glass rounded-lg px-4 py-3 min-w-[280px] max-w-[400px]">
          {/* Connection type header */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
            <div
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ backgroundColor: `${style.color}20` }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={style.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={getConnectionIcon(hoveredConnection.connectionType)} />
              </svg>
            </div>
            <span
              className="text-sm font-medium"
              style={{ color: style.color }}
            >
              {getConnectionTypeName(hoveredConnection.connectionType)}
            </span>
            {hoveredConnection.metadata?.isAsync && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                async
              </span>
            )}
          </div>

          {/* Source and target files */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 w-12">From:</span>
              <span className="text-xs text-white font-mono truncate">{sourceFile.name}</span>
            </div>
            <div className="flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={style.color}
                strokeWidth="2"
                className="opacity-50"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 w-12">To:</span>
              <span className="text-xs text-white font-mono truncate">{targetFile.name}</span>
            </div>
          </div>

          {/* Metadata details */}
          {hoveredConnection.metadata && (
            <div className="mt-3 pt-2 border-t border-white/10 space-y-1">
              {hoveredConnection.metadata.functionName && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/40">Function:</span>
                  <span className="text-xs text-viz-cyan font-mono">
                    {hoveredConnection.metadata.functionName}()
                  </span>
                </div>
              )}
              {hoveredConnection.metadata.variableName && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/40">Variable:</span>
                  <span className="text-xs text-purple-400 font-mono">
                    {hoveredConnection.metadata.variableName}
                    {hoveredConnection.metadata.variableType && (
                      <span className="text-white/40">: {hoveredConnection.metadata.variableType}</span>
                    )}
                  </span>
                </div>
              )}
              {hoveredConnection.metadata.lineNumber && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/40">Line:</span>
                  <span className="text-xs text-white/70">{hoveredConnection.metadata.lineNumber}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
