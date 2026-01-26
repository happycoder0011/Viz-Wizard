# Find Usages Feature - Technical Design

## Overview

The Find Usages feature allows users to discover all relationships a file has within the codebase. When triggered, it shows:
- **Incoming references**: Files that import, call, or depend on the selected file
- **Outgoing references**: Files that the selected file imports, calls, or depends on

## Architecture

### State Management (`visualizationStore.ts`)

```typescript
// Find Usages State
findUsagesOpen: boolean;                    // Is the panel open?
findUsagesFileId: string | null;            // Which file are we finding usages for?
findUsagesResults: UsageResult[];           // Array of found references
highlightedFileIds: Set<string>;            // Files to highlight in 3D view

interface UsageResult {
  fileId: string;
  fileName: string;
  filePath: string;
  category: string;
  connectionType: ConnectionType;           // import, call, dataflow, extends, implements
  direction: 'incoming' | 'outgoing';
  metadata?: {
    functionName?: string;                  // For function calls
    variableName?: string;                  // For data flow
    lineNumber?: number;                    // Source line
  };
}
```

### Actions

| Action | Description |
|--------|-------------|
| `openFindUsages(fileId)` | Analyze connections and open the panel |
| `closeFindUsages()` | Close panel and clear highlights |
| `highlightFiles(ids)` | Manually set highlighted files |
| `clearHighlights()` | Remove all highlights |
| `focusOnUsageFile(fileId)` | Navigate camera to a specific file |

## How Usages Are Found

The `openFindUsages` action scans the repository's connection graph:

```typescript
for (const connection of repository.connections) {
  // Skip directory connections (not meaningful usages)
  if (connection.type === 'directory') continue;

  if (connection.sourceId === fileId) {
    // This file USES the target file (outgoing)
    results.push({ ...targetInfo, direction: 'outgoing' });
  } else if (connection.targetId === fileId) {
    // The source file USES this file (incoming)
    results.push({ ...sourceInfo, direction: 'incoming' });
  }
}
```

## Connection Types Analyzed

| Type | Description | Color |
|------|-------------|-------|
| `import` | ES module import/require | Cyan |
| `call` | Direct function/method call | Green |
| `dataflow` | Data passing between modules | Purple |
| `extends` | Class inheritance | Amber |
| `implements` | Interface implementation | Amber |

**Note:** `directory` connections are excluded as they don't represent actual code dependencies.

## UI Components

### FindUsagesPanel (`src/components/ui/FindUsagesPanel.tsx`)

A full-height panel that appears on the right side with:

1. **Header**
   - Search icon and "Find Usages" title
   - Result count
   - Close button
   - Source file info with "View Code" action

2. **Results Section** (scrollable)
   - **"Used by" section**: Files that reference this file (incoming)
   - **"Uses" section**: Files this file references (outgoing)

3. **Result Item**
   - File icon (colored by category)
   - File name and path
   - Connection type badge
   - Metadata (function name, variable, line number)
   - Hover actions: Focus in 3D, View Code

4. **Footer**
   - Summary: "X incoming, Y outgoing"

### 3D Visualization (Building.tsx)

When Find Usages is active:

| Building State | Visual Effect |
|----------------|---------------|
| Highlighted (in results) | Brighter, green-tinted, scale 1.08, floating animation |
| Not highlighted | Dimmed (0.3 brightness), 60% opacity, scale 0.9 |
| Highlighted + Hovered | Extra bright, scale 1.15 |

## User Flow

```
1. User clicks on a building (file)
2. SelectedBuildingPanel appears
3. User clicks "Find Usages" button
   ↓
4. openFindUsages(fileId) is called
   ↓
5. Store scans all connections for this file
6. Results are categorized as incoming/outgoing
7. highlightedFileIds Set is populated
8. FindUsagesPanel opens
   ↓
9. 3D view updates:
   - Highlighted buildings glow green
   - Non-highlighted buildings dim
   ↓
10. User can:
    - Click result to focus camera on that file
    - Click "View Code" to open code editor
    - Click backdrop to close
```

## Future Enhancements

### Phase 2: Deep Usage Analysis

1. **Transitive Dependencies**
   - Show files that indirectly depend on the selected file
   - Depth slider: "Show usages up to N levels deep"

2. **Usage Context**
   - Show the actual line of code where the import/call happens
   - Click to open code editor at that line

3. **Export/Function-Level Analysis**
   - Find usages of specific exports, not just the file
   - "Find usages of function X" instead of "Find usages of file Y"

### Phase 3: Visualization Enhancements

1. **Connection Highlighting**
   - When hovering a result, highlight the specific connection line
   - Animated pulse along the connection path

2. **Mini-Map**
   - Small overview showing all highlighted files
   - Click to jump to any file

3. **Dependency Graph View**
   - Switch to a 2D graph view showing the relationship network
   - Force-directed layout centered on the selected file

### Phase 4: Search & Filter

1. **Filter by Connection Type**
   - "Show only imports"
   - "Show only function calls"

2. **Search Results**
   - Type to filter the results list

3. **Batch Operations**
   - Select multiple results
   - "Open all in code editor"
   - "Export dependency report"

## Mock Data Generation

The fixture generator creates realistic connection patterns:

```typescript
// Components → Hooks (call connections)
if (sourceFile.name.includes('Component') && targetFile.name.startsWith('use')) {
  connectionType = 'call';
  metadata = { functionName: targetFile.name };
}

// Services → Components (dataflow connections)
if (sourceFile.name.includes('Service')) {
  connectionType = 'dataflow';
  metadata = { variableName: 'data', variableType: 'Response' };
}

// Components → Types (implements connections)
if (targetFile.category === 'types') {
  connectionType = 'implements';
}
```

## Testing Checklist

- [ ] Click building → Click "Find Usages" → Panel opens
- [ ] Correct incoming references shown
- [ ] Correct outgoing references shown
- [ ] Non-highlighted buildings are dimmed
- [ ] Highlighted buildings glow green
- [ ] Click result → Camera focuses on that file
- [ ] Click "View Code" → Code editor opens
- [ ] Click backdrop → Panel closes, highlights clear
- [ ] Connection type badges show correct colors
- [ ] Metadata (function names, variables) displays correctly
