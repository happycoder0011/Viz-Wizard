'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GitHubClient } from '@/lib/github/client';

interface RepoInputProps {
  className?: string;
}

export function RepoInput({ className = '' }: RepoInputProps) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError('Please enter a GitHub URL');
      return;
    }

    // Parse the GitHub URL
    const parsed = GitHubClient.parseGitHubUrl(url.trim());
    if (!parsed) {
      setError('Invalid GitHub URL. Try: github.com/owner/repo or owner/repo');
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
          setError('Rate limit exceeded. Try again in a few minutes.');
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
      setError('Failed to connect. Please try again.');
      setIsLoading(false);
    }
  }, [url, router]);

  const exampleRepos = [
    { label: 'React', value: 'facebook/react' },
    { label: 'Vue', value: 'vuejs/vue' },
    { label: 'Svelte', value: 'sveltejs/svelte' },
  ];

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
        <div className="relative">
          {/* GitHub icon */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </div>

          {/* Input */}
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="github.com/owner/repo or owner/repo"
            className="w-full pl-12 pr-32 py-4 rounded-xl bg-viz-surface/80 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-viz-cyan/50 focus:ring-1 focus:ring-viz-cyan/30 transition-all"
            disabled={isLoading}
          />

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-lg bg-viz-cyan/20 border border-viz-cyan/50 text-viz-cyan font-medium hover:bg-viz-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>Explore</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-400 text-left pl-2"
          >
            {error}
          </motion.p>
        )}
      </form>

      {/* Example repos */}
      <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
        <span className="text-xs text-white/30">Try:</span>
        {exampleRepos.map((repo) => (
          <button
            key={repo.value}
            onClick={() => setUrl(repo.value)}
            className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-white/50 hover:text-viz-cyan hover:border-viz-cyan/30 transition-colors"
          >
            {repo.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default RepoInput;
