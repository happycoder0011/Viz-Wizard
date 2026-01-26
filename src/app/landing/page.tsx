'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20 - 10,
        y: (e.clientY / window.innerHeight) * 20 - 10,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-viz-bg text-white overflow-x-hidden overflow-y-auto fixed inset-0">
      {/* Gradient background effects - matching app style */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-viz-cyan/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-viz-purple/5 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-viz-green/3 rounded-full blur-[180px]" />
      </div>

      {/* Grid pattern overlay - matching app */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-viz-surface border border-viz-cyan/30 flex items-center justify-center glow-cyan">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00ffff" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-xl font-bold text-viz-cyan text-glow-cyan">
            Viz-Wizard
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/that-in-rust/Viz-Wizard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-viz-cyan transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg bg-viz-cyan/10 border border-viz-cyan/50 text-viz-cyan font-medium hover:bg-viz-cyan/20 hover:border-viz-cyan transition-all glow-cyan"
          >
            Try Demo
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 pt-16 md:pt-24 pb-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-viz-green animate-pulse" />
            <span className="text-sm text-white/70">No download. No setup. Just paste a URL.</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
          >
            <span className="text-white">
              Understand any codebase
            </span>
            <br />
            <span className="text-viz-cyan text-glow-cyan">
              in 30 seconds
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10"
          >
            Stop cloning repos. Stop reading endless docs. See the architecture
            as a 3D city and explore code on the go — from any device.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link
              href="/"
              className="group px-8 py-4 rounded-xl bg-viz-cyan/10 border border-viz-cyan text-viz-cyan font-semibold text-lg hover:bg-viz-cyan/20 transition-all glow-cyan flex items-center gap-2"
            >
              Explore Demo
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 rounded-xl glass text-white/70 font-semibold text-lg hover:text-white hover:border-white/20 transition-colors"
            >
              See How It Works
            </a>
          </motion.div>

          {/* Hero visual - 3D city preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="relative max-w-4xl mx-auto"
            style={{
              transform: `perspective(1000px) rotateX(${mousePosition.y * 0.3}deg) rotateY(${mousePosition.x * 0.3}deg)`,
            }}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-viz-cyan/10 rounded-2xl blur-2xl" />

            {/* Screenshot placeholder */}
            <div className="relative rounded-2xl border border-viz-cyan/20 overflow-hidden glass-dark shadow-2xl">
              <div className="aspect-video bg-viz-bg flex items-center justify-center">
                {/* Simulated 3D city view */}
                <div className="relative w-full h-full overflow-hidden">
                  {/* Grid floor */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `
                        linear-gradient(90deg, rgba(0,255,255,0.05) 1px, transparent 1px),
                        linear-gradient(rgba(0,255,255,0.05) 1px, transparent 1px)
                      `,
                      backgroundSize: '40px 40px',
                      transform: 'perspective(500px) rotateX(60deg) translateY(100px)',
                    }}
                  />

                  {/* Simulated buildings with viz colors */}
                  <div className="absolute inset-0 flex items-end justify-center gap-3 pb-20">
                    {[
                      { color: '#00ffff', height: 120 }, // cyan - core
                      { color: '#aa66ff', height: 80 },  // purple - legacy
                      { color: '#00ff88', height: 160 }, // green - test
                      { color: '#00ffff', height: 100 }, // cyan - core
                      { color: '#ffaa00', height: 140 }, // amber - config
                      { color: '#aa66ff', height: 70 },  // purple
                      { color: '#00ffff', height: 110 }, // cyan
                      { color: '#00ff88', height: 90 },  // green
                    ].map((building, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: building.height, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 + i * 0.1 }}
                        className="w-10 md:w-14 rounded-t-sm relative"
                        style={{
                          background: `linear-gradient(180deg, ${building.color}60 0%, ${building.color}20 100%)`,
                          boxShadow: `0 0 30px ${building.color}40, inset 0 0 20px ${building.color}20`,
                          border: `1px solid ${building.color}40`,
                        }}
                      >
                        {/* Window lights */}
                        <div className="absolute inset-2 flex flex-col gap-1">
                          {[...Array(Math.floor(building.height / 20))].map((_, j) => (
                            <div key={j} className="flex gap-1">
                              <div
                                className="w-1.5 h-1.5 rounded-sm"
                                style={{ backgroundColor: `${building.color}80` }}
                              />
                              <div
                                className="w-1.5 h-1.5 rounded-sm"
                                style={{ backgroundColor: `${building.color}40` }}
                              />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Connection lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <motion.line
                      x1="30%" y1="60%" x2="45%" y2="50%"
                      stroke="#00ffff"
                      strokeWidth="1"
                      strokeOpacity="0.3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, delay: 1.5 }}
                    />
                    <motion.line
                      x1="55%" y1="45%" x2="70%" y2="55%"
                      stroke="#aa66ff"
                      strokeWidth="1"
                      strokeOpacity="0.3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, delay: 1.7 }}
                    />
                  </svg>

                  {/* Floating tooltip */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2 }}
                    className="absolute top-1/4 right-1/4 px-3 py-2 rounded-lg glass border border-viz-cyan/30"
                  >
                    <div className="text-xs text-viz-cyan font-mono">UserAuth.tsx</div>
                    <div className="text-[10px] text-white/40">245 lines • Core</div>
                  </motion.div>
                </div>
              </div>

              {/* Browser chrome */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-viz-surface border-b border-white/5 flex items-center px-3 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-viz-red/60" />
                  <div className="w-3 h-3 rounded-full bg-viz-amber/60" />
                  <div className="w-3 h-3 rounded-full bg-viz-green/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-white/5 text-xs text-white/30 font-mono">
                    viz-wizard.pages.dev
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social proof */}
      <section className="relative z-10 px-6 md:px-12 py-12 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-white/30 text-sm mb-8">Built for developers who value their time</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {['Startups', 'Open Source', 'Enterprises', 'Agencies'].map((company) => (
              <div key={company} className="text-white/20 text-lg font-semibold">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-white/40">The problem with</span>{' '}
              <span className="text-white">understanding code</span>
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">
              Every developer has felt it. That moment when you open a new codebase
              and have no idea where to start.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '⏱️',
                title: '47 hours',
                desc: 'Average time to understand a new codebase',
                color: 'viz-cyan',
              },
              {
                icon: '🔄',
                title: '60% of time',
                desc: 'Developers spend reading code, not writing it',
                color: 'viz-purple',
              },
              {
                icon: '😤',
                title: '#1 frustration',
                desc: 'Onboarding to unfamiliar projects',
                color: 'viz-amber',
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl glass hover:border-white/20 transition-colors"
              >
                <div className="text-4xl mb-4">{stat.icon}</div>
                <div className={`text-2xl font-bold text-${stat.color} mb-2`}>{stat.title}</div>
                <div className="text-white/40">{stat.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 px-6 md:px-12 py-24">
        <div className="absolute inset-0 bg-viz-cyan/[0.02]" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              How it works
            </h2>
            <p className="text-white/40 text-lg">
              Three steps. Zero setup. Instant understanding.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Paste a GitHub URL',
                desc: 'No cloning. No local setup. Just paste and go.',
                color: '#00ffff',
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00ffff" strokeWidth="1.5">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Explore the 3D city',
                desc: 'Every file is a building. Zoom, pan, and click to explore.',
                color: '#aa66ff',
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#aa66ff" strokeWidth="1.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Ask AI anything',
                desc: 'Select code, ask questions, get instant explanations.',
                color: '#00ff88',
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative p-8 rounded-2xl glass"
                style={{ borderColor: `${item.color}20` }}
              >
                <div
                  className="text-6xl font-bold absolute top-4 right-4"
                  style={{ color: `${item.color}10` }}
                >
                  {item.step}
                </div>
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-white/40">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Features that actually matter
            </h2>
            <p className="text-white/40 text-lg">
              Built by developers, for developers who value their time.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: '3D Architecture View',
                desc: 'See your entire codebase as an interactive city. Height = complexity. Color = file type. Connections = dependencies.',
                color: '#00ffff',
              },
              {
                title: 'Critical Path Radar',
                desc: 'Instantly identify the 5% of files causing 80% of issues. Risk scoring based on coupling, complexity, and change velocity.',
                color: '#ffaa00',
              },
              {
                title: 'AI Code Copilot',
                desc: 'Select any code and ask questions. The AI has full context of the file and its connections. Supports Claude & GPT-4.',
                color: '#aa66ff',
              },
              {
                title: 'Find Usages',
                desc: 'Click any file and instantly see what depends on it and what it depends on. Trace data flow through your codebase.',
                color: '#00ff88',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl glass hover:scale-[1.02] transition-transform"
                style={{
                  borderColor: `${feature.color}20`,
                  background: `linear-gradient(135deg, ${feature.color}05 0%, transparent 50%)`,
                }}
              >
                <div
                  className="w-3 h-3 rounded-full mb-4"
                  style={{ backgroundColor: feature.color, boxShadow: `0 0 20px ${feature.color}60` }}
                />
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/50">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <div className="absolute inset-0 bg-viz-purple/[0.02]" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Perfect for
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { emoji: '🆕', title: 'New team members', desc: 'Onboard in hours, not weeks', color: '#00ffff' },
              { emoji: '👀', title: 'Code reviewers', desc: 'See impact at a glance', color: '#aa66ff' },
              { emoji: '🔓', title: 'Open source contributors', desc: 'Understand before you PR', color: '#00ff88' },
              { emoji: '📊', title: 'Engineering managers', desc: 'Spot technical debt fast', color: '#ffaa00' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl glass text-center hover:border-white/20 transition-colors"
              >
                <div className="text-3xl mb-3">{item.emoji}</div>
                <div className="font-semibold text-white mb-1">{item.title}</div>
                <div className="text-sm text-white/40">{item.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <span className="text-white">Ready to see your code</span>
              <br />
              <span className="text-viz-cyan text-glow-cyan">
                like never before?
              </span>
            </h2>
            <p className="text-white/40 text-lg mb-10">
              No signup required. No credit card. Just paste a URL and explore.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-xl bg-viz-cyan/10 border border-viz-cyan text-viz-cyan font-semibold text-xl hover:bg-viz-cyan/20 transition-all glow-cyan"
            >
              Try Viz-Wizard Now
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 md:px-12 py-12 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-viz-surface border border-viz-cyan/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ffff" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-white/50">Viz-Wizard</span>
          </div>
          <div className="text-white/30 text-sm">
            Built with love for developers who value their time
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/that-in-rust/Viz-Wizard" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-viz-cyan transition-colors">
              GitHub
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-viz-cyan transition-colors">
              Twitter
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
