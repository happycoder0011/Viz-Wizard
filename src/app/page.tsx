'use client';

import dynamic from 'next/dynamic';
import { Header } from '@/components/ui/Header';
import { Tooltip } from '@/components/ui/Tooltip';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { SelectedBuildingPanel } from '@/components/ui/SelectedBuildingPanel';
import { Legend } from '@/components/ui/Legend';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ZoomIndicator } from '@/components/ui/ZoomIndicator';
import { ConnectionTooltip } from '@/components/ui/ConnectionTooltip';
import { ConnectionDetailsPanel } from '@/components/ui/ConnectionDetailsPanel';

// Dynamically import the 3D scene to avoid SSR issues
const Scene = dynamic(
  () => import('@/components/canvas/Scene').then((mod) => mod.Scene),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-viz-bg flex items-center justify-center">
        <div className="spinner" />
      </div>
    ),
  }
);

// Dynamically import CodeEditor to avoid SSR issues with monaco-editor and react-rnd
const CodeEditor = dynamic(
  () => import('@/components/ui/CodeEditor').then((mod) => mod.CodeEditor),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="fixed inset-0 bg-viz-bg overflow-hidden">
      {/* 3D Canvas - fills entire viewport */}
      <div className="absolute inset-0">
        <Scene />
      </div>

      {/* UI Overlays */}
      <Header />
      <Breadcrumbs />
      <Tooltip />
      <ControlPanel />
      <SelectedBuildingPanel />
      <ZoomIndicator />
      <Legend />
      <LoadingOverlay />
      <CodeEditor />
      <ConnectionTooltip />
      <ConnectionDetailsPanel />
    </main>
  );
}
