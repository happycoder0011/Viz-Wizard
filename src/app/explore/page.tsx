'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GitHubClient } from '@/lib/github/client';

export default function ExplorePage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    // Parse the GitHub URL
    const parsed = GitHubClient.parseGitHubUrl(url.trim());
    if (!parsed) {
      setError('Invalid GitHub URL. Please use format: github.com/owner/repo or owner/repo');
      return;
    }

    setIsLoading(true);

    try {
      // Verify the repo exists by calling our API
      const response = await fetch(`/api/repo/${parsed.owner}/${parsed.name}`);

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 404) {
          setError('Repository not found. Make sure it exists and is public.');
        } else if (response.status === 429) {
          setError('Rate limit exceeded. Please try again in a few minutes.');
        } else {
          setError(data.error || 'Failed to fetch repository');
        }
        setIsLoading(false);
        return;
      }

      // Store the repo data in sessionStorage for the app to use
      const repoData = await response.json();
      sessionStorage.setItem('viz-wizard-repo', JSON.stringify(repoData));
      sessionStorage.setItem('viz-wizard-repo-source', 'github');

      // Navigate to the app
      router.push(`/app?repo=${parsed.owner}/${parsed.name}`);
    } catch (err) {
      console.error('Error fetching repo:', err);
      setError('Failed to connect. Please check your internet connection and try again.');
      setIsLoading(false);
    }
  }, [url, router]);

  return (
    <div className="min-h-screen bg-viz-bg text-white flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-viz-cyan/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-viz-purple/5 rounded-full blur-[150px]" />
      </div>

      {/* Grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-viz-surface border border-viz-cyan/30 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00ffff" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-xl font-bold text-viz-cyan">Viz-Wizard</span>
        </Link>

        <Link
          href="/app"
          className="text-white/50 hover:text-white/70 transition-colors text-sm"
        >
          Skip to Demo
        </Link>
      </nav>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-white">Enter a </span>
              <span className="text-viz-cyan">GitHub Repository</span>
            </h1>
            <p className="text-white/50">
              Paste any public GitHub repository URL to visualize its architecture
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Input container */}
            <div className="relative">
              {/* GitHub icon */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>

              {/* Input field */}
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                placeholder="github.com/owner/repo"
                className="w-full pl-14 pr-4 py-5 rounded-xl bg-viz-surface/80 border border-white/10 text-white text-lg placeholder-white/30 focus:outline-none focus:border-viz-cyan/50 focus:ring-2 focus:ring-viz-cyan/20 transition-all"
                disabled={isLoading}
                autoFocus
              />
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-viz-cyan/10 border border-viz-cyan text-viz-cyan font-semibold text-lg hover:bg-viz-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Fetching Repository...</span>
                </>
              ) : (
                <>
                  <span>Visualize Repository</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </motion.form>

          {/* Help text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 text-center"
          >
            <p className="text-white/30 text-sm mb-4">
              Supported formats:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'owner/repo',
                'github.com/owner/repo',
                'https://github.com/owner/repo',
              ].map((format) => (
                <code
                  key={format}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs font-mono"
                >
                  {format}
                </code>
              ))}
            </div>
          </motion.div>

          {/* Demo link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 text-center"
          >
            <p className="text-white/30 text-sm mb-3">
              Just want to see how it works?
            </p>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 text-white/50 hover:text-viz-purple transition-colors"
            >
              <span>Try the interactive demo</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
