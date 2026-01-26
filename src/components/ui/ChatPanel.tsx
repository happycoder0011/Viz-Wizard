'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore } from '@/stores/visualizationStore';

interface ChatPanelProps {
  fileName: string;
  filePath: string;
}

export function ChatPanel({ fileName, filePath }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get store values with safety checks
  const chatMessages = useVisualizationStore(state => state.chatMessages) || [];
  const chatLoading = useVisualizationStore(state => state.chatLoading) || false;
  const chatError = useVisualizationStore(state => state.chatError);
  const chatApiKey = useVisualizationStore(state => state.chatApiKey);
  const chatModel = useVisualizationStore(state => state.chatModel) || 'claude';
  const selectedCode = useVisualizationStore(state => state.selectedCode);
  const sendChatMessage = useVisualizationStore(state => state.sendChatMessage);
  const clearChatMessages = useVisualizationStore(state => state.clearChatMessages);
  const setChatApiKey = useVisualizationStore(state => state.setChatApiKey);
  const setChatModel = useVisualizationStore(state => state.setChatModel);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;

    const message = input.trim();
    setInput('');
    await sendChatMessage(message);
  }, [input, chatLoading, sendChatMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const quickActions = [
    { label: 'Explain this', prompt: 'Explain what this code does in simple terms.' },
    { label: 'Find bugs', prompt: 'What potential bugs or issues do you see in this code?' },
    { label: 'Improve', prompt: 'How can this code be improved or refactored?' },
    { label: 'How it works', prompt: 'Walk me through how this code works step by step.' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e]/50 border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-[#1a1a2e]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-white/80">Code Copilot</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="Settings"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
          <button
            onClick={clearChatMessages}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="Clear chat"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/10 overflow-hidden"
          >
            <div className="p-3 space-y-3 bg-[#1a1a2e]/80">
              <div>
                <label className="text-[10px] text-white/50 uppercase tracking-wider mb-1 block">
                  API Key {chatModel === 'claude' ? '(Anthropic)' : '(OpenAI)'}
                </label>
                <input
                  type="password"
                  value={chatApiKey || ''}
                  onChange={(e) => setChatApiKey(e.target.value || null)}
                  placeholder={chatModel === 'claude' ? 'sk-ant-...' : 'sk-...'}
                  className="w-full px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs text-white/90 placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/50 uppercase tracking-wider mb-1 block">
                  Model
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChatModel('claude')}
                    className={`flex-1 px-2 py-1.5 rounded text-xs transition-colors ${
                      chatModel === 'claude'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                        : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Claude
                  </button>
                  <button
                    onClick={() => setChatModel('gpt-4')}
                    className={`flex-1 px-2 py-1.5 rounded text-xs transition-colors ${
                      chatModel === 'gpt-4'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                        : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    GPT-4
                  </button>
                </div>
              </div>
              {!chatApiKey && (
                <p className="text-[10px] text-amber-400/80">
                  Enter your API key to start chatting
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Code Indicator */}
      {selectedCode && (
        <div className="px-3 py-2 bg-cyan-500/10 border-b border-cyan-500/20">
          <div className="flex items-center gap-2 text-[10px] text-cyan-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span>Code selected ({selectedCode.split('\n').length} lines)</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatMessages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-xs text-white/50 mb-1">Ask me about this code</p>
            <p className="text-[10px] text-white/30">
              Select code in the editor for specific questions
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}

        {chatLoading && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Thinking...</span>
          </div>
        )}

        {chatError && (
          <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {chatError}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {chatMessages.length === 0 && !chatLoading && (
        <div className="px-3 pb-2">
          <div className="flex flex-wrap gap-1">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  setInput(action.prompt);
                  inputRef.current?.focus();
                }}
                className="px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[10px] text-white/60 hover:text-white/80 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={chatApiKey ? 'Ask about this code...' : 'Set API key to start...'}
            disabled={!chatApiKey || chatLoading}
            rows={1}
            className="w-full px-3 py-2 pr-10 rounded-lg bg-white/5 border border-white/10 text-xs text-white/90 placeholder-white/30 focus:outline-none focus:border-cyan-500/50 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '36px', maxHeight: '100px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || !chatApiKey || chatLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    codeContext?: {
      fileName: string;
      selectedCode?: string;
    };
  };
}

function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[90%] rounded-lg px-3 py-2 ${
          isUser
            ? 'bg-cyan-500/20 border border-cyan-500/30'
            : 'bg-white/5 border border-white/10'
        }`}
      >
        {message.codeContext?.selectedCode && (
          <div className="mb-2 p-2 rounded bg-black/30 border border-white/10">
            <code className="text-[10px] text-white/60 whitespace-pre-wrap break-all">
              {message.codeContext.selectedCode.slice(0, 100)}
              {message.codeContext.selectedCode.length > 100 && '...'}
            </code>
          </div>
        )}
        <div className="text-xs text-white/90 whitespace-pre-wrap break-words prose prose-invert prose-sm max-w-none">
          <FormattedContent content={message.content} />
        </div>
        <div className="mt-1 text-[9px] text-white/30">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </motion.div>
  );
}

// Simple markdown-like formatting for code blocks
function FormattedContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const codeContent = part.replace(/```\w*\n?/g, '').replace(/```$/g, '');
          return (
            <pre key={i} className="my-2 p-2 rounded bg-black/40 border border-white/10 overflow-x-auto">
              <code className="text-[10px] text-cyan-300/80">{codeContent}</code>
            </pre>
          );
        }
        // Handle inline code
        const inlineParts = part.split(/(`[^`]+`)/g);
        return (
          <span key={i}>
            {inlineParts.map((inline, j) => {
              if (inline.startsWith('`') && inline.endsWith('`')) {
                return (
                  <code key={j} className="px-1 py-0.5 rounded bg-white/10 text-cyan-300/80 text-[10px]">
                    {inline.slice(1, -1)}
                  </code>
                );
              }
              return inline;
            })}
          </span>
        );
      })}
    </>
  );
}

export default ChatPanel;
