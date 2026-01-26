'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Rnd } from 'react-rnd';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore } from '@/stores/visualizationStore';
import { CATEGORY_COLORS } from '@/lib/mockData';
import { FileCategory } from '@/types/repository';
import { ChatPanel } from './ChatPanel';
import type { editor } from 'monaco-editor';

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-[#1e1e2e]">
        <div className="spinner" />
      </div>
    ),
  }
);

// Map file extensions to Monaco languages
function getLanguageFromExtension(extension: string): string {
  const map: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'md': 'markdown',
    'yaml': 'yaml',
    'html': 'html',
  };
  return map[extension] || 'plaintext';
}

// Get file icon based on category
function getFileIcon(category: FileCategory) {
  const iconPaths: Record<FileCategory, string> = {
    core: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6',
    legacy: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M12 18v-6 M9 15l3 3 3-3',
    style: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
    test: 'M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
    config: 'M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z M12 9a3 3 0 100 6 3 3 0 000-6z',
    docs: 'M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  };
  return iconPaths[category];
}

export function CodeEditor() {
  const {
    codeEditorOpen,
    codeEditorFileId,
    codeEditorPosition,
    codeEditorSize,
    repository,
    closeCodeEditor,
    setCodeEditorPosition,
    setCodeEditorSize,
    chatPanelOpen,
    setSelectedCode,
    toggleChatPanel,
  } = useVisualizationStore();

  const [isMaximized, setIsMaximized] = useState(false);
  const [prevSize, setPrevSize] = useState(codeEditorSize);
  const [prevPosition, setPrevPosition] = useState(codeEditorPosition);
  const [chatWidth] = useState(320);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Find the file data
  const file = repository?.allFiles.find(f => f.id === codeEditorFileId);

  // Handle maximize toggle
  const handleMaximize = useCallback(() => {
    if (isMaximized) {
      setCodeEditorPosition(prevPosition);
      setCodeEditorSize(prevSize);
      setIsMaximized(false);
    } else {
      setPrevPosition(codeEditorPosition);
      setPrevSize(codeEditorSize);
      setCodeEditorPosition({ x: 20, y: 60 });
      setCodeEditorSize({
        width: typeof window !== 'undefined' ? window.innerWidth - 40 : 800,
        height: typeof window !== 'undefined' ? window.innerHeight - 80 : 600
      });
      setIsMaximized(true);
    }
  }, [isMaximized, prevPosition, prevSize, codeEditorPosition, codeEditorSize, setCodeEditorPosition, setCodeEditorSize]);

  // Reset maximized state and set initial position when editor opens
  useEffect(() => {
    if (codeEditorOpen) {
      setIsMaximized(false);
      // Center the editor on screen on first open
      if (codeEditorPosition.x === 100 && typeof window !== 'undefined') {
        const editorWidth = 900; // Match the default width in store
        const x = Math.max(20, (window.innerWidth - editorWidth) / 2);
        setCodeEditorPosition({ x, y: 60 });
      }
    }
  }, [codeEditorOpen, codeEditorPosition.x, setCodeEditorPosition]);

  if (!codeEditorOpen || !file) return null;

  const colors = CATEGORY_COLORS[file.category];
  const language = file.language || getLanguageFromExtension(file.extension);
  const content = file.content || `// ${file.name}\n// Path: ${file.path}\n// Lines: ${file.lineCount}\n// Complexity: ${file.complexity}%\n\n// Content not available for this mock file`;

  return (
    <AnimatePresence>
      {/* Backdrop overlay - dims everything and blocks interactions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm"
        onClick={closeCodeEditor}
      />

      {/* Code Editor Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[60] pointer-events-none"
      >
        <Rnd
          position={codeEditorPosition}
          size={codeEditorSize}
          onDragStop={(e, d) => {
            setCodeEditorPosition({ x: d.x, y: d.y });
          }}
          onResizeStop={(e, direction, ref, delta, position) => {
            setCodeEditorSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height),
            });
            setCodeEditorPosition(position);
          }}
          minWidth={chatPanelOpen ? 700 : 350}
          minHeight={300}
          bounds="window"
          dragHandleClassName="code-editor-drag-handle"
          className="pointer-events-auto"
          enableResizing={!isMaximized}
          disableDragging={isMaximized}
        >
          <div className="w-full h-full flex flex-col rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-[#1e1e2e]/95 backdrop-blur-xl">
            {/* Header - Drag Handle */}
            <div
              className="code-editor-drag-handle flex items-center justify-between px-3 py-2 bg-[#1e1e2e] border-b border-white/10 cursor-move select-none"
              style={{ backgroundColor: `${colors.emissive}10` }}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {/* File icon */}
                <div
                  className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${colors.emissive}20` }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={colors.emissive}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={getFileIcon(file.category)} />
                  </svg>
                </div>

                {/* File name and path */}
                <div className="overflow-hidden">
                  <div className="text-sm font-medium text-white truncate">{file.name}</div>
                  <div className="text-[10px] text-white/40 font-mono truncate">{file.path}</div>
                </div>
              </div>

              {/* Window controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Chat Toggle */}
                <button
                  onClick={toggleChatPanel}
                  className={`p-1.5 rounded transition-colors group ${
                    chatPanelOpen
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'hover:bg-white/10 text-white/40 hover:text-white/70'
                  }`}
                  title={chatPanelOpen ? 'Close Chat' : 'Open AI Chat'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={chatPanelOpen ? 'text-cyan-400' : ''}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>

                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* Minimize */}
                <button
                  onClick={closeCodeEditor}
                  className="p-1.5 rounded hover:bg-white/10 transition-colors group"
                  title="Minimize"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40 group-hover:text-white/70">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>

                {/* Maximize/Restore */}
                <button
                  onClick={handleMaximize}
                  className="p-1.5 rounded hover:bg-white/10 transition-colors group"
                  title={isMaximized ? 'Restore' : 'Maximize'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40 group-hover:text-white/70">
                    {isMaximized ? (
                      <>
                        <rect x="5" y="9" width="10" height="10" rx="1" />
                        <path d="M9 9V5a1 1 0 011-1h9a1 1 0 011 1v9a1 1 0 01-1 1h-4" />
                      </>
                    ) : (
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                    )}
                  </svg>
                </button>

                {/* Close */}
                <button
                  onClick={closeCodeEditor}
                  className="p-1.5 rounded hover:bg-red-500/20 transition-colors group"
                  title="Close"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40 group-hover:text-red-400">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Editor + Chat Split View */}
            <div className="flex-1 flex overflow-hidden">
              {/* Monaco Editor */}
              <div className={`flex-1 overflow-hidden ${chatPanelOpen ? 'border-r border-white/10' : ''}`}>
              <Editor
                height="100%"
                language={language}
                value={content}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                  lineNumbers: 'on',
                  glyphMargin: false,
                  folding: true,
                  lineDecorationsWidth: 10,
                  lineNumbersMinChars: 3,
                  renderLineHighlight: 'line',
                  scrollbar: {
                    verticalScrollbarSize: 8,
                    horizontalScrollbarSize: 8,
                  },
                  padding: { top: 10, bottom: 10 },
                }}
                beforeMount={(monaco) => {
                  // Custom dark theme that matches the visualization
                  monaco.editor.defineTheme('viz-dark', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [
                      { token: 'comment', foreground: '6a9955' },
                      { token: 'keyword', foreground: 'c586c0' },
                      { token: 'string', foreground: 'ce9178' },
                      { token: 'number', foreground: 'b5cea8' },
                      { token: 'type', foreground: '4ec9b0' },
                    ],
                    colors: {
                      'editor.background': '#1e1e2e',
                      'editor.foreground': '#cdd6f4',
                      'editorLineNumber.foreground': '#6c7086',
                      'editorLineNumber.activeForeground': '#cdd6f4',
                      'editor.lineHighlightBackground': '#313244',
                      'editor.selectionBackground': '#45475a',
                      'editorCursor.foreground': '#00ffff',
                    },
                  });
                }}
                onMount={(editor, monaco) => {
                  monaco.editor.setTheme('viz-dark');
                  editorRef.current = editor;

                  // Track selection changes
                  editor.onDidChangeCursorSelection((e) => {
                    const selection = editor.getSelection();
                    if (selection && !selection.isEmpty()) {
                      const selectedText = editor.getModel()?.getValueInRange(selection);
                      if (selectedText) {
                        setSelectedCode(selectedText);
                      }
                    } else {
                      setSelectedCode(null);
                    }
                  });
                }}
              />
              </div>

              {/* Chat Panel */}
              {chatPanelOpen && (
                <div
                  className="flex-shrink-0 h-full overflow-hidden"
                  style={{ width: chatWidth }}
                >
                  <ChatPanel fileName={file.name} filePath={file.path} />
                </div>
              )}
            </div>

            {/* Footer with file stats */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#181825] border-t border-white/10 text-[10px] text-white/40">
              <div className="flex items-center gap-3">
                <span>{language}</span>
                <span>{file.lineCount.toLocaleString()} lines</span>
                <span>Complexity: {file.complexity}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                  style={{
                    backgroundColor: `${colors.emissive}20`,
                    color: colors.emissive,
                  }}
                >
                  {file.category}
                </span>
              </div>
            </div>
          </div>
        </Rnd>
      </motion.div>
    </AnimatePresence>
  );
}

// Export for dynamic import
export default CodeEditor;
