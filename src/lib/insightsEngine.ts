/**
 * Codebase Insights Engine
 *
 * Pure analysis functions that derive actionable insights from RepositoryData.
 * No AI dependency — all insights come from structural analysis.
 */

import type {
  FileNode,
  Connection,
  RepositoryData,
  RepositoryStats,
} from '@/types/repository';
import type { GitHistoryData } from '@/stores/visualizationStore';

// ===== Types =====

export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface HealthFactor {
  label: string;
  score: number;    // 0-100 (higher = worse)
  weight: number;
  detail: string;
}

export type FindingSeverity = 'critical' | 'warning' | 'info';
export type FindingCategory = 'god-file' | 'hub-file' | 'test-gap' | 'dead-code' | 'bus-factor' | 'circular-dep';

export interface InsightFinding {
  id: string;
  severity: FindingSeverity;
  category: FindingCategory;
  title: string;
  description: string;
  fileIds: string[];
  metric?: string;
}

export interface ModuleBreakdown {
  name: string;
  fileCount: number;
  totalLines: number;
  avgComplexity: number;
  dominantLanguage: string;
  testCount: number;
  coreCount: number;
  healthIndicator: 'good' | 'fair' | 'poor';
  fileIds: string[];
}

export interface StartHereEntry {
  fileId: string;
  fileName: string;
  filePath: string;
  dependentCount: number;
  reason: string;
}

export interface CodebaseInsights {
  healthGrade: HealthGrade;
  healthScore: number;
  healthFactors: HealthFactor[];
  summary: string;
  summaryDetails: string[];
  findings: InsightFinding[];
  modules: ModuleBreakdown[];
  startHere: StartHereEntry[];
}

// ===== Health Grade =====

function buildInboundCounts(connections: Connection[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const c of connections) {
    if (c.type === 'directory') continue;
    counts.set(c.targetId, (counts.get(c.targetId) ?? 0) + 1);
  }
  return counts;
}

export function calculateHealthGrade(
  files: FileNode[],
  connections: Connection[],
  stats: RepositoryStats
): { grade: HealthGrade; score: number; factors: HealthFactor[] } {
  const factors: HealthFactor[] = [];
  const coreFiles = files.filter(f => f.category === 'core' || f.category === 'legacy');

  // Factor 1: Average Complexity (30%)
  const avgComplexity = stats.avgComplexity ??
    (coreFiles.length > 0
      ? coreFiles.reduce((s, f) => s + f.complexity, 0) / coreFiles.length
      : 0);
  const complexityRisk = Math.min(100, avgComplexity * 1.25);
  factors.push({
    label: 'Complexity',
    score: Math.round(complexityRisk),
    weight: 0.30,
    detail: `${Math.round(avgComplexity)} avg across ${coreFiles.length} code files`,
  });

  // Factor 2: Max Coupling (25%)
  const inboundCounts = buildInboundCounts(connections);
  const maxCoupling = inboundCounts.size > 0
    ? Math.max(...inboundCounts.values())
    : 0;
  const couplingRisk = Math.min(100, maxCoupling * 5);
  factors.push({
    label: 'Coupling',
    score: Math.round(couplingRisk),
    weight: 0.25,
    detail: `Most coupled file has ${maxCoupling} dependents`,
  });

  // Factor 3: Test-to-Code Ratio (25%)
  const testFiles = files.filter(f => f.category === 'test');
  const testRatio = coreFiles.length > 0 ? testFiles.length / coreFiles.length : 1;
  const testRisk = Math.round(100 - Math.min(100, testRatio * 125));
  factors.push({
    label: 'Test Coverage',
    score: testRisk,
    weight: 0.25,
    detail: `${testFiles.length} tests for ${coreFiles.length} code files (${Math.round(testRatio * 100)}%)`,
  });

  // Factor 4: Circular Dependencies (20%)
  const importPairs = new Set<string>();
  let circularCount = 0;
  for (const c of connections) {
    if (c.type !== 'import') continue;
    const reverse = `${c.targetId}->${c.sourceId}`;
    if (importPairs.has(reverse)) circularCount++;
    importPairs.add(`${c.sourceId}->${c.targetId}`);
  }
  const circularRisk = circularCount === 0 ? 0 : Math.min(100, circularCount * 20);
  factors.push({
    label: 'Circular Deps',
    score: circularRisk,
    weight: 0.20,
    detail: circularCount === 0 ? 'None detected' : `${circularCount} circular imports`,
  });

  // Weighted health score (invert risk to health)
  const score = Math.round(
    factors.reduce((sum, f) => sum + (100 - f.score) * f.weight, 0)
  );

  let grade: HealthGrade;
  if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 55) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  return { grade, score, factors };
}

// ===== Architecture Summary =====

const LANG_LABELS: Record<string, string> = {
  ts: 'TypeScript', tsx: 'TypeScript', typescript: 'TypeScript',
  js: 'JavaScript', jsx: 'JavaScript', javascript: 'JavaScript',
  py: 'Python', python: 'Python',
  rs: 'Rust', rust: 'Rust',
  go: 'Go',
  java: 'Java',
  c: 'C', cpp: 'C++',
  rb: 'Ruby', ruby: 'Ruby',
  php: 'PHP',
  cs: 'C#', csharp: 'C#',
  swift: 'Swift',
};

export function generateSummary(repo: RepositoryData): { summary: string; details: string[] } {
  const { stats, allFiles } = repo;
  const languages = stats.languages ?? {};

  const sortedLangs = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  const dominantKey = sortedLangs[0]?.[0] ?? 'mixed';
  const dominantLabel = LANG_LABELS[dominantKey.toLowerCase()] ?? dominantKey;

  const topDirs = new Set(allFiles.map(f => f.path.split('/')[0]).filter(Boolean));

  const summary = `A ${dominantLabel}-heavy codebase with ${stats.totalFiles.toLocaleString()} files across ${topDirs.size} main modules`;

  const details: string[] = [];
  details.push(`${stats.totalLines.toLocaleString()} total lines of code`);

  if (sortedLangs.length > 1) {
    const langList = sortedLangs.slice(0, 4)
      .map(([l, c]) => `${LANG_LABELS[l.toLowerCase()] ?? l} (${typeof c === 'number' ? c.toLocaleString() : c})`)
      .join(', ');
    details.push(`Languages: ${langList}`);
  }

  const avgComplexity = stats.avgComplexity ??
    (allFiles.length > 0
      ? allFiles.reduce((s, f) => s + f.complexity, 0) / allFiles.length
      : 0);
  const complexityLabel = avgComplexity < 30 ? 'low' : avgComplexity < 55 ? 'moderate' : 'high';
  details.push(`Average complexity: ${Math.round(avgComplexity)}/100 (${complexityLabel})`);

  return { summary, details };
}

// ===== Findings =====

export function generateFindings(
  files: FileNode[],
  connections: Connection[],
  gitHistoryData?: GitHistoryData | null
): InsightFinding[] {
  const findings: InsightFinding[] = [];
  const inboundCounts = buildInboundCounts(connections);

  // 1. God Files
  const godFiles = files
    .filter(f =>
      f.category !== 'test' && f.category !== 'docs' && f.category !== 'config' &&
      (f.complexity > 80 || f.lineCount > 500)
    )
    .sort((a, b) => (b.complexity + b.lineCount / 10) - (a.complexity + a.lineCount / 10));

  if (godFiles.length > 0) {
    const worst = godFiles[0];
    findings.push({
      id: 'god-files',
      severity: godFiles.length >= 3 ? 'critical' : 'warning',
      category: 'god-file',
      title: `${godFiles.length} God File${godFiles.length > 1 ? 's' : ''} Detected`,
      description: `${worst.name} has ${worst.lineCount.toLocaleString()} lines and complexity ${worst.complexity}.${godFiles.length > 1 ? ` ${godFiles.length - 1} other file${godFiles.length > 2 ? 's' : ''} also exceed thresholds.` : ''}`,
      fileIds: godFiles.slice(0, 5).map(f => f.id),
      metric: `${worst.lineCount.toLocaleString()} lines`,
    });
  }

  // 2. Hub Files (high coupling)
  const hubFiles = files
    .filter(f => (inboundCounts.get(f.id) ?? 0) > 10)
    .sort((a, b) => (inboundCounts.get(b.id) ?? 0) - (inboundCounts.get(a.id) ?? 0));

  if (hubFiles.length > 0) {
    const worst = hubFiles[0];
    const count = inboundCounts.get(worst.id) ?? 0;
    findings.push({
      id: 'hub-files',
      severity: count > 20 ? 'critical' : 'warning',
      category: 'hub-file',
      title: `${hubFiles.length} Hub File${hubFiles.length > 1 ? 's' : ''} (High Coupling)`,
      description: `${worst.name} is depended on by ${count} other files. Changes here have wide blast radius.`,
      fileIds: hubFiles.slice(0, 5).map(f => f.id),
      metric: `${count} dependents`,
    });
  }

  // 3. Test Gaps
  const testFiles = files.filter(f => f.category === 'test');
  const coreFiles = files.filter(f => f.category === 'core' || f.category === 'legacy');
  const testRatio = coreFiles.length > 0 ? testFiles.length / coreFiles.length : 1;

  if (testRatio < 0.5 && coreFiles.length > 3) {
    findings.push({
      id: 'test-gaps',
      severity: testRatio < 0.2 ? 'critical' : 'warning',
      category: 'test-gap',
      title: 'Low Test Coverage',
      description: `Only ${testFiles.length} test file${testFiles.length !== 1 ? 's' : ''} for ${coreFiles.length} code files (${Math.round(testRatio * 100)}% ratio).`,
      fileIds: coreFiles
        .filter(f => (inboundCounts.get(f.id) ?? 0) > 3)
        .slice(0, 5)
        .map(f => f.id),
      metric: `${Math.round(testRatio * 100)}% ratio`,
    });
  }

  // 4. Dead Code (files with 0 incoming connections)
  const filesWithInbound = new Set<string>();
  for (const c of connections) {
    if (c.type !== 'directory') filesWithInbound.add(c.targetId);
  }
  const deadFiles = files.filter(f =>
    f.category === 'core' &&
    !filesWithInbound.has(f.id) &&
    !/\b(index|main|app|entry|server)\b/i.test(f.name)
  );

  if (deadFiles.length > 0) {
    findings.push({
      id: 'dead-code',
      severity: deadFiles.length > 10 ? 'warning' : 'info',
      category: 'dead-code',
      title: `${deadFiles.length} Potentially Unused File${deadFiles.length > 1 ? 's' : ''}`,
      description: `${deadFiles[0].name}${deadFiles.length > 1 ? ` and ${deadFiles.length - 1} other${deadFiles.length > 2 ? 's' : ''}` : ''} have no incoming dependencies. May be dead code or entry points.`,
      fileIds: deadFiles.slice(0, 5).map(f => f.id),
      metric: `${deadFiles.length} files`,
    });
  }

  // 5. Bus Factor Risks (only with git history)
  if (gitHistoryData?.ownershipData) {
    const highRiskFiles = Object.entries(gitHistoryData.ownershipData)
      .filter(([, data]) => data.riskLevel === 'high' && data.busFactor === 1)
      .map(([path]) => files.find(f => f.path === path))
      .filter((f): f is FileNode => f !== undefined);

    if (highRiskFiles.length > 0) {
      findings.push({
        id: 'bus-factor',
        severity: highRiskFiles.length > 5 ? 'critical' : 'warning',
        category: 'bus-factor',
        title: `${highRiskFiles.length} Single-Owner File${highRiskFiles.length > 1 ? 's' : ''}`,
        description: `${highRiskFiles[0].name}${highRiskFiles.length > 1 ? ` and ${highRiskFiles.length - 1} other${highRiskFiles.length > 2 ? 's' : ''}` : ''} have bus factor of 1. Knowledge silos.`,
        fileIds: highRiskFiles.slice(0, 5).map(f => f.id),
        metric: 'Bus factor: 1',
      });
    }
  }

  // 6. Circular Dependencies
  const importPairs = new Set<string>();
  const circularFiles = new Set<string>();
  for (const c of connections) {
    if (c.type !== 'import') continue;
    const reverse = `${c.targetId}->${c.sourceId}`;
    if (importPairs.has(reverse)) {
      circularFiles.add(c.sourceId);
      circularFiles.add(c.targetId);
    }
    importPairs.add(`${c.sourceId}->${c.targetId}`);
  }

  if (circularFiles.size > 0) {
    findings.push({
      id: 'circular-deps',
      severity: circularFiles.size > 6 ? 'critical' : 'warning',
      category: 'circular-dep',
      title: `Circular Dependencies (${circularFiles.size / 2} cycle${circularFiles.size > 2 ? 's' : ''})`,
      description: `${circularFiles.size} files involved in circular imports. These make refactoring harder.`,
      fileIds: [...circularFiles].slice(0, 5),
      metric: `${circularFiles.size} files`,
    });
  }

  // Sort: critical > warning > info
  const severityOrder: Record<FindingSeverity, number> = { critical: 0, warning: 1, info: 2 };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return findings.slice(0, 5);
}

// ===== Module Breakdown =====

export function generateModuleBreakdown(files: FileNode[]): ModuleBreakdown[] {
  const groups = new Map<string, FileNode[]>();
  for (const f of files) {
    const topDir = f.path.includes('/') ? f.path.split('/')[0] : '(root)';
    const arr = groups.get(topDir) ?? [];
    arr.push(f);
    groups.set(topDir, arr);
  }

  return Array.from(groups.entries())
    .map(([name, moduleFiles]) => {
      const coreCount = moduleFiles.filter(f => f.category === 'core' || f.category === 'legacy').length;
      const testCount = moduleFiles.filter(f => f.category === 'test').length;
      const avgComplexity = moduleFiles.reduce((s, f) => s + f.complexity, 0) / Math.max(moduleFiles.length, 1);
      const totalLines = moduleFiles.reduce((s, f) => s + f.lineCount, 0);

      const extCounts = new Map<string, number>();
      for (const f of moduleFiles) {
        extCounts.set(f.extension, (extCounts.get(f.extension) ?? 0) + 1);
      }
      const dominantLanguage = [...extCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'mixed';

      const testRatio = coreCount > 0 ? testCount / coreCount : 1;
      const healthIndicator: 'good' | 'fair' | 'poor' =
        avgComplexity < 40 && testRatio > 0.4 ? 'good' :
        avgComplexity < 65 || testRatio > 0.2 ? 'fair' : 'poor';

      return {
        name,
        fileCount: moduleFiles.length,
        totalLines,
        avgComplexity: Math.round(avgComplexity),
        dominantLanguage,
        testCount,
        coreCount,
        healthIndicator,
        fileIds: moduleFiles.map(f => f.id),
      };
    })
    .sort((a, b) => b.fileCount - a.fileCount);
}

// ===== Start Here =====

export function generateStartHere(
  files: FileNode[],
  connections: Connection[]
): StartHereEntry[] {
  const inboundCounts = buildInboundCounts(connections);

  return files
    .filter(f => f.category === 'core' && (inboundCounts.get(f.id) ?? 0) > 0)
    .sort((a, b) => (inboundCounts.get(b.id) ?? 0) - (inboundCounts.get(a.id) ?? 0))
    .slice(0, 5)
    .map(f => ({
      fileId: f.id,
      fileName: f.name,
      filePath: f.path,
      dependentCount: inboundCounts.get(f.id) ?? 0,
      reason: `Core file, imported by ${inboundCounts.get(f.id)} file${(inboundCounts.get(f.id) ?? 0) !== 1 ? 's' : ''}`,
    }));
}

// ===== Main Entry =====

export function generateInsights(
  repo: RepositoryData,
  gitHistoryData?: GitHistoryData | null
): CodebaseInsights {
  const { allFiles, connections, stats } = repo;
  const { grade, score, factors } = calculateHealthGrade(allFiles, connections, stats);
  const { summary, details } = generateSummary(repo);
  const findings = generateFindings(allFiles, connections, gitHistoryData);
  const modules = generateModuleBreakdown(allFiles);
  const startHere = generateStartHere(allFiles, connections);

  return {
    healthGrade: grade,
    healthScore: score,
    healthFactors: factors,
    summary,
    summaryDetails: details,
    findings,
    modules,
    startHere,
  };
}
