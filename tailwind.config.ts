import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Viz-Wizard color palette
        'viz': {
          'cyan': '#00ffff',
          'cyan-dim': '#00cccc',
          'amber': '#ffaa00',
          'amber-dim': '#cc8800',
          'purple': '#aa66ff',
          'purple-dim': '#8844cc',
          'green': '#00ff88',
          'red': '#ff4466',
          'bg': '#0a0a0f',
          'surface': '#12121a',
          'border': 'rgba(255, 255, 255, 0.1)',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { opacity: '0.5' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}

export default config
