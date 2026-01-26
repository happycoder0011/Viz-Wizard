import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Viz-Wizard | Codebase Visualization',
  description: 'Understand any repository in 30 seconds. Beautiful 3D visualization of code architecture.',
  keywords: ['code visualization', 'github', 'architecture', '3d', 'developer tools'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {/* Subtle noise overlay for texture */}
        <div className="noise-overlay" />
      </body>
    </html>
  );
}
