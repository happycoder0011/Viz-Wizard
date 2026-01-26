'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore } from '@/stores/visualizationStore';
import { CONNECTION_STYLES, ConnectionType, FileCategory } from '@/types/repository';
import { CATEGORY_COLORS } from '@/lib/mockData';

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

// Get connection type description
function getConnectionDescription(type: ConnectionType): string {
  const descriptions: Record<ConnectionType, string> = {
    import: 'ES module import/require statement',
    directory: 'Parent directory relationship',
    call: 'Function or method invocation',
    dataflow: 'Data passed between modules',
    extends: 'Class inheritance relationship',
    implements: 'Interface implementation',
  };
  return descriptions[type] || '';
}

// File card component
interface FileCardProps {
  name: string;
  path: string;
  category: FileCategory;
  lineCount: number;
  label: 'Source' | 'Target';
  onViewCode: () => void;
  onFocus: () => void;
}

function FileCard({ name, path, category, lineCount, label, onViewCode, onFocus }: FileCardProps) {
  const colors = CATEGORY_COLORS[category];

  return (
    <div
      className="rounded-lg p-3 border"
      style={{
        backgroundColor: `${colors.emissive}08`,
        borderColor: `${colors.emissive}20`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-white/40 uppercase tracking-wider">{label}</span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
          style={{
            backgroundColor: `${colors.emissive}20`,
            color: colors.emissive,
          }}
        >
          {category}
        </span>
      </div>

      <div className="mb-2">
        <div className="text-sm font-medium text-white truncate">{name}</div>
        <div className="text-[10px] text-white/40 font-mono truncate">{path}</div>
      </div>

      <div className="text-[10px] text-white/50 mb-3">
        {lineCount.toLocaleString()} lines
      </div>

      <div className="flex gap-2">
        <button
          onClick={onViewCode}
          className="flex-1 px-2 py-1.5 rounded text-[10px] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center justify-center gap-1"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          View Code
        </button>
        <button
          onClick={onFocus}
          className="flex-1 px-2 py-1.5 rounded text-[10px] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center justify-center gap-1"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Focus
        </button>
      </div>
    </div>
  );
}

export function ConnectionDetailsPanel() {
  const {
    selectedConnection,
    repository,
    cityData,
    selectConnection,
    openCodeEditor,
    selectBuilding,
  } = useVisualizationStore();

  if (!selectedConnection || !repository || !cityData) return null;

  const style = CONNECTION_STYLES[selectedConnection.connectionType];
  const sourceFile = repository.allFiles.find(f => f.id === selectedConnection.sourceFileId);
  const targetFile = repository.allFiles.find(f => f.id === selectedConnection.targetFileId);

  if (!sourceFile || !targetFile) return null;

  // Find building IDs for focus functionality
  const findBuildingId = (fileId: string): string | null => {
    for (const district of cityData.districts) {
      const building = district.buildings.find(b => b.fileId === fileId);
      if (building) return building.id;
    }
    return null;
  };

  const sourceBuildingId = findBuildingId(sourceFile.id);
  const targetBuildingId = findBuildingId(targetFile.id);

  const handleClose = () => selectConnection(null, null);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 w-80"
      >
        <div className="glass rounded-xl overflow-hidden">
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: `${style.color}10` }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${style.color}20` }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={style.color}
                  strokeWidth="2"
                >
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
              </div>
              <div>
                <h3
                  className="text-sm font-medium"
                  style={{ color: style.color }}
                >
                  {getConnectionTypeName(selectedConnection.connectionType)}
                </h3>
                <p className="text-[10px] text-white/40">
                  {getConnectionDescription(selectedConnection.connectionType)}
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Source File */}
            <FileCard
              name={sourceFile.name}
              path={sourceFile.path}
              category={sourceFile.category}
              lineCount={sourceFile.lineCount}
              label="Source"
              onViewCode={() => openCodeEditor(sourceFile.id)}
              onFocus={() => sourceBuildingId && selectBuilding(sourceBuildingId)}
            />

            {/* Arrow indicator */}
            <div className="flex items-center justify-center py-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${style.color}10` }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={style.color}
                  strokeWidth="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              </div>
            </div>

            {/* Target File */}
            <FileCard
              name={targetFile.name}
              path={targetFile.path}
              category={targetFile.category}
              lineCount={targetFile.lineCount}
              label="Target"
              onViewCode={() => openCodeEditor(targetFile.id)}
              onFocus={() => targetBuildingId && selectBuilding(targetBuildingId)}
            />

            {/* Metadata */}
            {selectedConnection.metadata && (
              <div className="pt-3 border-t border-white/10">
                <h4 className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
                  Connection Details
                </h4>
                <div className="space-y-1.5">
                  {selectedConnection.metadata.functionName && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Function</span>
                      <span className="text-xs text-viz-cyan font-mono">
                        {selectedConnection.metadata.functionName}()
                      </span>
                    </div>
                  )}
                  {selectedConnection.metadata.variableName && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Variable</span>
                      <span className="text-xs text-purple-400 font-mono">
                        {selectedConnection.metadata.variableName}
                      </span>
                    </div>
                  )}
                  {selectedConnection.metadata.variableType && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Type</span>
                      <span className="text-xs text-amber-400 font-mono">
                        {selectedConnection.metadata.variableType}
                      </span>
                    </div>
                  )}
                  {selectedConnection.metadata.isAsync !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Async</span>
                      <span className={`text-xs ${selectedConnection.metadata.isAsync ? 'text-green-400' : 'text-white/40'}`}>
                        {selectedConnection.metadata.isAsync ? 'Yes' : 'No'}
                      </span>
                    </div>
                  )}
                  {selectedConnection.metadata.lineNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Line Number</span>
                      <span className="text-xs text-white/70">
                        {selectedConnection.metadata.lineNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
