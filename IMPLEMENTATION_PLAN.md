# Viz-Wizard: Star Features Implementation Plan

## Overview

Two transformative features that turn Viz-Wizard from a "pretty visualization" into an indispensable engineering tool:

1. **Critical Path Radar** — Instantly identify the 5% of files causing 80% of problems
2. **Code Copilot Chat** — AI assistant with full context of the file you're viewing

---

## Feature 1: Critical Path Radar

### Concept

One-click visualization of your codebase's highest-risk files based on:
- **Coupling Score** — How many files depend on this?
- **Complexity Score** — Cyclomatic complexity, lines of code
- **Velocity Score** — How often is this file changed? (from git history)
- **Coverage Score** — Test coverage (if available)

### UI Design

```
┌─────────────────────────────────────────────────────────┐
│  [🎯 Critical Path]  [Normal View]           Header     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│    3D City View                                         │
│    - Critical files: GOLD + PULSING                     │
│    - Other files: GRAYSCALE + 50% opacity               │
│    - Critical connections: RED GLOW                     │
│    - Risk scores floating above buildings               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Critical Path Summary (bottom panel)                   │
│  ┌─────────┬─────────┬─────────┬─────────┬──────────┐  │
│  │ auth.ts │ db.ts   │ api.ts  │ utils.ts│ config.ts│  │
│  │ Risk:92 │ Risk:87 │ Risk:76 │ Risk:71 │ Risk:68  │  │
│  └─────────┴─────────┴─────────┴─────────┴──────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Model

```typescript
interface CriticalPathScore {
  fileId: string;
  couplingScore: number;      // 0-100: inbound + outbound connections
  complexityScore: number;    // 0-100: from existing complexity metric
  velocityScore: number;      // 0-100: change frequency (mock for now)
  coverageScore: number;      // 0-100: test coverage (inverse - low = bad)
  overallRisk: number;        // Weighted combination
  factors: string[];          // Human-readable explanations
}

interface CriticalPathState {
  enabled: boolean;
  criticalFiles: CriticalPathScore[];
  threshold: number;          // Top N files or risk > X
}
```

### Risk Calculation

```typescript
function calculateRisk(file: FileNode, connections: Connection[]): number {
  // Coupling: How connected is this file?
  const inbound = connections.filter(c => c.targetId === file.id).length;
  const outbound = connections.filter(c => c.sourceId === file.id).length;
  const couplingScore = Math.min(100, (inbound + outbound) * 5);

  // Complexity: Already have this
  const complexityScore = file.complexity;

  // Velocity: Mock for now (would come from git log)
  const velocityScore = Math.random() * 50 + 25; // 25-75

  // Coverage: Inverse of test relationship
  const hasTests = connections.some(c =>
    c.sourceId.includes('test') && c.targetId === file.id
  );
  const coverageScore = hasTests ? 30 : 80; // No tests = high risk

  // Weighted combination
  const overallRisk = (
    couplingScore * 0.35 +
    complexityScore * 0.30 +
    velocityScore * 0.20 +
    coverageScore * 0.15
  );

  return Math.round(overallRisk);
}
```

### Implementation Steps

1. **Add Critical Path state to store** (30 min)
   - `criticalPathEnabled`, `criticalFiles`, `calculateCriticalPath()`

2. **Create CriticalPathPanel component** (1 hr)
   - Bottom panel showing top 5-10 critical files
   - Click to focus on file in 3D view

3. **Update Building component for critical mode** (1 hr)
   - Gold material with pulse animation for critical files
   - Grayscale + dimmed for non-critical files
   - Floating risk score badge

4. **Add toggle button to Header** (30 min)
   - "🎯 Critical Path" button
   - Visual indicator when active

---

## Feature 2: Code Copilot Chat

### Concept

An AI chat interface embedded in the Code Editor that:
- Has full context of the current file
- Can answer questions about specific code blocks
- Explains complex logic in plain English
- Suggests improvements or identifies issues

### UI Design

```
┌─────────────────────────────────────────────────────────┐
│  📄 auth.service.ts                    [_][□][×]        │
├───────────────────────────────┬─────────────────────────┤
│                               │  💬 Code Copilot        │
│  // Code Editor               │  ─────────────────────  │
│  export class AuthService {   │                         │
│    async login(user, pass) {  │  "What does the login   │
│      const hash = await...    │   function do?"         │
│    }                          │                         │
│  }                            │  ─────────────────────  │
│                               │  The login function:    │
│  [Select code + right-click]  │  1. Hashes the password │
│  → "Explain this"             │  2. Queries the DB...   │
│  → "What could go wrong?"     │  3. Returns a JWT...    │
│  → "How is this used?"        │                         │
│                               │  ─────────────────────  │
│                               │  [Ask a question...]    │
├───────────────────────────────┴─────────────────────────┤
│  typescript │ 245 lines │ Complexity: 65%               │
└─────────────────────────────────────────────────────────┘
```

### Architecture Options

#### Option A: Client-Side API (Recommended for MVP)

```
User → CodeEditor → Chat Component → Anthropic/OpenAI API → Response
                         ↓
                   [API Key in localStorage or env]
```

**Pros:** Simple, no backend needed
**Cons:** API key exposed in client (ok for personal use)

#### Option B: Edge Function Proxy

```
User → Chat Component → /api/chat (Edge Function) → LLM API → Response
                              ↓
                        [API Key secure on server]
```

**Pros:** Secure, can add rate limiting
**Cons:** Need Cloudflare Workers or Vercel Edge

#### Option C: Bring Your Own Key (BYOK)

```
User enters API key → Stored in localStorage → Direct API calls
```

**Pros:** No cost to us, user controls their usage
**Cons:** Friction for new users

### Recommended: Option C (BYOK) for MVP

Users bring their own API key. This:
- Avoids billing complexity
- Lets power users use their preferred model
- Works offline (with local models later)

### Data Model

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  codeContext?: {
    fileName: string;
    selectedCode?: string;
    lineRange?: [number, number];
  };
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  apiKey: string | null;        // Stored in localStorage
  model: 'claude' | 'gpt-4' | 'local';
}

interface CodeCopilotProps {
  fileContent: string;
  fileName: string;
  filePath: string;
  language: string;
  selectedCode?: string;
}
```

### System Prompt

```typescript
const SYSTEM_PROMPT = `You are a code assistant embedded in Viz-Wizard, a codebase visualization tool.

You are currently viewing: {fileName}
Language: {language}
File path: {filePath}

The user may ask you to:
- Explain what code does
- Identify potential bugs or issues
- Suggest improvements
- Explain how this code connects to other parts of the codebase

Be concise but thorough. Use code examples when helpful.
If the user selects specific code, focus your answer on that selection.

Current file content:
\`\`\`{language}
{fileContent}
\`\`\`
`;
```

### Quick Actions (Context Menu)

When user selects code in the editor:
- **"Explain this"** — What does this code do?
- **"What could go wrong?"** — Potential bugs/edge cases
- **"How is this used?"** — Find usages + explain pattern
- **"Suggest improvements"** — Refactoring suggestions

### Implementation Steps

1. **Create ChatPanel component** (2 hrs)
   - Message list with user/assistant bubbles
   - Input field with send button
   - Loading state with typing indicator
   - Auto-scroll to bottom

2. **Add chat state to store** (30 min)
   - Messages array, loading state, API key

3. **Create API integration** (1 hr)
   - Support for Claude API (Anthropic)
   - Support for OpenAI API
   - Error handling and retry logic

4. **Create Settings modal for API key** (1 hr)
   - Input field for API key
   - Model selector (Claude/GPT-4)
   - Test connection button
   - Store in localStorage

5. **Update CodeEditor layout** (1 hr)
   - Split view: code on left, chat on right
   - Collapsible chat panel
   - Resize handle between panels

6. **Add context menu for quick actions** (1 hr)
   - Right-click on selected code
   - Quick action buttons above selection

7. **Implement code selection context** (1 hr)
   - Track selected text in Monaco
   - Include in chat context
   - Highlight relevant code when discussing

---

## Combined UX Flow

```
1. User opens Viz-Wizard
   ↓
2. Clicks "🎯 Critical Path"
   → Gold buildings pulse, risk scores appear
   ↓
3. Clicks on high-risk building (auth.service.ts)
   → Camera zooms to building
   → File info panel appears
   ↓
4. Clicks "View Code"
   → Code Editor opens with Chat panel
   ↓
5. Selects complex function, asks "What does this do?"
   → AI explains the code in context
   ↓
6. Asks "What could break if I change this?"
   → AI explains dependencies + risks
   ↓
7. User now understands the critical file deeply
   → Can make informed decisions about refactoring
```

---

## Technical Implementation

### New Files

```
src/
├── components/
│   ├── ui/
│   │   ├── ChatPanel.tsx           # Chat interface
│   │   ├── ChatMessage.tsx         # Individual message bubble
│   │   ├── ChatInput.tsx           # Input with send button
│   │   ├── CriticalPathPanel.tsx   # Bottom panel for critical files
│   │   ├── ApiKeyModal.tsx         # Settings for API key
│   │   └── QuickActions.tsx        # Context menu for code selection
│   └── canvas/
│       └── CriticalPathOverlay.tsx # Risk score badges in 3D
├── lib/
│   ├── ai/
│   │   ├── anthropic.ts            # Claude API integration
│   │   ├── openai.ts               # OpenAI API integration
│   │   └── prompts.ts              # System prompts
│   └── criticalPath.ts             # Risk calculation logic
└── stores/
    └── visualizationStore.ts       # Extended with chat + critical path state
```

### Modified Files

```
src/
├── components/
│   ├── ui/
│   │   ├── CodeEditor.tsx          # Add chat panel, split view
│   │   └── Header.tsx              # Add Critical Path toggle
│   └── canvas/
│       └── Building.tsx            # Critical path materials
└── app/
    └── page.tsx                    # Add CriticalPathPanel
```

### Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",  // Claude API
    "openai": "^4.x",                 // OpenAI API (optional)
    "zustand": "^4.x",                // Already have
    "@monaco-editor/react": "^4.x"   // Already have
  }
}
```

---

## Implementation Phases

### Phase 1: Critical Path Radar (3-4 hours)
- [ ] Risk calculation logic
- [ ] Critical path state in store
- [ ] Building component updates (gold/grayscale modes)
- [ ] Critical Path toggle in Header
- [ ] CriticalPathPanel (bottom summary)

### Phase 2: Chat Infrastructure (2-3 hours)
- [ ] ChatPanel component (UI only)
- [ ] Chat state in store
- [ ] ApiKeyModal for configuration
- [ ] localStorage persistence for API key

### Phase 3: AI Integration (2-3 hours)
- [ ] Anthropic Claude API integration
- [ ] System prompt with file context
- [ ] Error handling and loading states
- [ ] Message history management

### Phase 4: Code Editor Integration (2-3 hours)
- [ ] Split view layout (code + chat)
- [ ] Code selection tracking
- [ ] Quick actions context menu
- [ ] Selected code highlighting

### Phase 5: Polish & Deploy (1-2 hours)
- [ ] Responsive design
- [ ] Keyboard shortcuts (Cmd+K for chat)
- [ ] Onboarding for first-time users
- [ ] Deploy to Cloudflare Pages

---

## Total Estimated Time

| Phase | Time |
|-------|------|
| Critical Path Radar | 3-4 hours |
| Chat Infrastructure | 2-3 hours |
| AI Integration | 2-3 hours |
| Code Editor Integration | 2-3 hours |
| Polish & Deploy | 1-2 hours |
| **Total** | **10-15 hours** |

---

## Success Metrics

1. **Critical Path Radar**
   - User can identify top 5 risky files in < 5 seconds
   - Risk scores correlate with actual bug frequency (validate later)

2. **Code Copilot Chat**
   - Average response time < 3 seconds
   - User asks follow-up questions (engagement signal)
   - Code explanations rated helpful (future: thumbs up/down)

---

## Future Enhancements

1. **Git History Integration** — Real velocity scores from commit history
2. **Test Coverage Integration** — Real coverage data from CI
3. **Team Context** — "Ask about code" includes who wrote it
4. **Local LLM Support** — Ollama/LMStudio for privacy-conscious users
5. **Code Modification** — AI can suggest edits, user can apply
6. **Multi-file Context** — Chat understands related files too
