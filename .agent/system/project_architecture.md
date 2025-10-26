# Project Architecture

## Project Overview

**Prompt Refinement UI** is a two-panel web application for testing and refining LLM prompts. Users can edit generator prompts (produce outputs) and grader prompts (evaluate outputs), run them against multiple models side-by-side, execute across entire datasets with variable substitution, and compare results using multiple metrics (grade, tokens, cost, latency). The system supports both manual grading and automated grading via LLM-powered graders.

**Current Status**: Phase 1 (Frontend MVP) complete with mock data layer. Phase 2 (Backend Integration) starts tomorrow.

---

## Tech Stack

### Frontend (Phase 1 - Current)
- **Next.js 14** - React framework with App Router
- **React 18.3** - UI library
- **TypeScript 5.3** - Type safety
- **Tailwind CSS 3.4** - Utility-first styling with custom design tokens
- **CodeMirror 6** - Code editor with syntax highlighting
- **shadcn/ui** - Component library (Radix UI primitives)
- **lucide-react** - Icon library
- **Jest 29.7** - Test runner with React Testing Library
- **Storybook 9.1** - Component development and documentation

#### Design System
- **Background**: `#FAFAFA` (neutral-50)
- **Primary Accent**: `#8685ef` (purple-500)
- **Secondary Accents**: `#faf8ff` (purple-50), `#dedbee` (purple-100)
- **Single Light Theme**: Creamy background aesthetic
- **Animations**: Custom spring transitions (300ms), fade transitions (150ms)

### Backend (Phase 2 - Planned)
- **Supabase** - PostgreSQL database with Realtime subscriptions and Auth
- **Vercel Serverless** - API routes for LLM provider calls
- **OpenAI SDK** - GPT model integration
- **Anthropic SDK** - Claude model integration
- **Worker Queue** - Async job execution with retry/backoff logic

---

## Project Structure

```
/
├── frontend/                          # Next.js application (Phase 1 complete)
│   ├── app/
│   │   ├── layout.tsx                # Root layout with providers
│   │   └── page.tsx                  # Main page: two-panel orchestration
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives
│   │   ├── EditorPanel.tsx           # Left panel: prompt editing
│   │   ├── PromptEditor.tsx          # CodeMirror wrapper
│   │   ├── DatasetSelector.tsx       # Dataset preview modal
│   │   ├── ResultsGrid.tsx           # Right panel: results table
│   │   └── __tests__/                # Component unit tests
│   │
│   ├── lib/
│   │   ├── types.ts                  # TypeScript interfaces (PERMANENT)
│   │   ├── utils.ts                  # Helper functions (PERMANENT)
│   │   ├── mockRepo.temp.ts          # localStorage CRUD (TEMPORARY)
│   │   └── mockRunExecutor.temp.ts   # Mock execution (TEMPORARY)
│   │
│   ├── stories/                      # Storybook component development
│   ├── styles/                       # Global styles
│   ├── tailwind.config.ts            # Design tokens
│   └── package.json
│
├── backend/                           # Backend implementation (Phase 2 - empty)
│   └── README.md                     # Planned structure documentation
│
├── .agent/                            # Project documentation
│   ├── README.md                     # Directory guide and index
│   └── system/
│       └── project_architecture.md   # This file
│
├── specs.md                           # Complete product specification
├── design-context.yaml                # Design system tokens
└── package.json                       # Workspace root scripts
```

---

## Core Features

### Phase 1 (Current - Complete)

1. **Two-Panel Layout**
   - Left: Prompt editor with CodeMirror (syntax highlighting for `{{variables}}`, `<tags>`, "json")
   - Right: Results grid with model comparison (max 4 models)
   - Dynamic view modes: Focus (65/35) and Balanced (30/70) with auto-transitions

2. **Prompt Management**
   - Two types: Generator (produces outputs) and Grader (evaluates outputs)
   - Inline editing with autosave on blur, prompt switch, and before run
   - Automatic versioning on run (only if text changed since last run)
   - Rename resets version counter to 1

3. **Dataset Handling**
   - Upload CSV/JSON files via toolbar
   - Preview first 50 rows in modal
   - Variable substitution using `{{placeholder}}` syntax
   - Runtime validation (placeholders must exist in dataset headers)

4. **Multi-Model Execution**
   - Add/edit/remove model columns in results grid
   - Mock async execution with random delays (1-3 seconds)
   - Per-cell states: idle, running, ok, error, malformed
   - Cell re-run with cache bypass (hover overlay during active run)
   - Single active run enforcement
   - First-load initialization seeds data and auto-selects first model

5. **Metric Comparison**
   - Cycle through views: Grade → Tokens → Cost → Latency
   - Grade view with colored badges (red/yellow/green gradient)
   - Manual grading (thumbs up/down) when no grader selected
   - Grader overlay (click badge to show grader output in cell)
   - Summary row with averages per column

6. **Keyboard Shortcuts**
   - Cmd/Ctrl+Enter: Run prompt
   - Ctrl+Shift+Z: Toggle line wrapping in editor

### Phase 2 (Planned - Tomorrow)

1. **Authentication** - Supabase Auth with OAuth/magic link
2. **Real LLM Calls** - OpenAI and Anthropic provider adapters
3. **Async Execution** - Worker queue with retry logic and backoff
4. **Realtime Updates** - Supabase Realtime subscriptions for cell updates
5. **API Key Management** - Encrypted storage per user (Supabase Vault)
6. **Pricing Table** - Editable model pricing for cost calculations
7. **Cache Layer** - Keyed by (prompt + model + input hash)

---

## UI Layout

### Left Panel: Editor (30% balanced / 65% focus)
- Prompt dropdown (create new, switch between prompts)
- Inline name editor (click to rename; no type badge displayed)
- Version label (e.g., "v6")
- CodeMirror editor with syntax highlighting
  - `{{variables}}` highlighted in purple
  - `<tags>` highlighted
  - "json" keyword highlighted
  - Line wrapping toggle: **Ctrl+Shift+Z** (not Cmd)
  - **Autosave on blur, prompt switch, and before run**
- Variables section (auto-detected placeholders, read-only chips)
- Dataset preview (read-only: name, row count, preview button; no selection UI; upload in toolbar)
- Run button (bottom-right overlay, Cmd/Ctrl+Enter shortcut)

### Right Panel: Results (70% balanced / 35% focus)
**Toolbar:**
- Metric cycling button (Grade → Tokens → Cost → Latency)
- Grader selector dropdown (optional)
- Dataset upload button (CSV/JSON)

**Results Grid:**
- **First-load initialization**: Seeds data, deduplicates provider/model combos, auto-selects first model
- Header row: Row column + Model columns (max 4)
- Model headers: Provider/Model name, click to edit, hover to remove
  - **Editing a model clears stale cells for that column**
  - **Removing a model shifts column indices for remaining cells**
- Data rows: One per dataset entry
- Summary row: Averages per column
- "+" button to add model columns

**Cell Features:**
- Click to expand full output in modal
- Bottom-right badge shows current metric
- Grade badges color-coded (red/yellow/green)
- Manual grade toggle when no grader (thumbs up/down)
- Grader overlay (click badge to show grader output in cell)
- Re-run button (hover overlay during active run)

### View Modes (Auto-Transition)
- **Focus Mode** (65% left / 35% right): Triggers when editor focused
- **Balanced Mode** (30% left / 70% right): Triggers when editor blurs or Run clicked
- **Transition**: 300ms spring animation
- **Persistence**: View mode saved to localStorage

---

## TEMPORARY vs PERMANENT Files

### TEMPORARY (Delete Tomorrow in Phase 2)

Files marked `*.temp.ts` - allow UI development without backend dependency:

| File | Purpose | Replacement |
|------|---------|-------------|
| `frontend/lib/mockRepo.temp.ts` | localStorage CRUD for all entities (Prompts, Datasets, Models, Runs, Cells) | Supabase client with RLS |
| `frontend/lib/mockRepo.temp.test.ts` | Tests for mock repository | Integration tests with real DB |
| `frontend/lib/mockRunExecutor.temp.ts` | Simulated async execution with random outputs | API calls + worker queue |

**Why temporary?**
- Same TypeScript interfaces as final backend (easy migration)
- No network calls needed for UI development
- ~400 lines to delete, clean replacement

### PERMANENT (Stays in Phase 2+)

Everything else stays:
- **All UI components** (`frontend/components/`)
- **TypeScript interfaces** (`frontend/lib/types.ts`)
- **Helper utilities** (`frontend/lib/utils.ts`)
- **Design system** (Tailwind config, styles)
- **Test infrastructure** (Jest, Storybook)
- **Page orchestration** (`frontend/app/page.tsx`)

**Minor updates needed**:
- `page.tsx`: Replace mock function calls with API calls (~20 lines)
- `EditorPanel.tsx`: Replace `executeRun()` with API endpoint (~5 lines)
- `ResultsGrid.tsx`: Wire Realtime subscriptions for cell updates (~10 lines)

---

## Phase 2 Migration Plan

### Step 1: Remove Temporary Files

```bash
cd frontend/lib
rm mockRepo.temp.ts
rm mockRepo.temp.test.ts
rm mockRunExecutor.temp.ts
```

### Step 2: Install Supabase

```bash
npm install @supabase/supabase-js
```

Add environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3: Create Backend Structure

```bash
mkdir -p backend/supabase/migrations
mkdir -p backend/api
mkdir -p backend/workers
mkdir -p backend/providers
mkdir -p backend/utils
```

### Step 4: Implement Database Schema

Create `backend/supabase/migrations/001_initial_schema.sql`:
- `users` table (via Supabase Auth)
- `api_keys` table (encrypted, per provider)
- `prompts` table (with RLS on user_id)
- `datasets` table (headers + row_count, files in Storage)
- `runs` table (prompt + dataset + models + grader)
- `run_models` table (provider + model per column)
- `run_cells` table (execution results, keyed by run_id + column_index + row_index)
- `pricing` table (per-user pricing overrides)
- `cache` table (keyed by prompt_id + model + input_hash)

See [specs.md lines 199-237](../../specs.md#L199-L237) for complete schema.

### Step 5: Replace Frontend Data Layer

Create `frontend/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

Update imports in components:
- Replace `mockRepo.temp` imports with Supabase client calls
- Replace `mockRunExecutor.temp` with API endpoint calls
- Add Realtime subscriptions in `ResultsGrid.tsx`

### Step 6: Implement Backend Services

**Provider Adapters** (`backend/providers/`):
```typescript
async function runPrompt({
  provider, model, apiKey, promptText, variables
}): Promise<{
  output_raw: string,
  tokens_in: number,
  tokens_out: number,
  latency_ms: number
}>
```

**Worker Queue** (`backend/workers/`):
- Enqueue tasks for each (model × dataset row) pair
- Execute with concurrency limit (5-10 per model)
- Retry with exponential backoff (3 attempts)
- Update cells via Supabase with Realtime events

**API Routes** (`backend/api/`):
- `POST /runs` - Create run + enqueue tasks
- `POST /cell/rerun` - Bypass cache and re-execute single cell
- Standard CRUD for prompts, datasets, models

### Step 7: Test Migration

```bash
npm run test                    # All tests passing
npm run dev                     # Start dev server
# Verify:
# - Auth flow works
# - Real LLM calls execute
# - Cell updates appear in realtime
# - Undo/redo still functional
```

**Estimated Effort**: 2-3 days for experienced developer

---

## Known Limitations

### Phase 1 (Current)

**Data Persistence:**
- localStorage only - data lost if browser cache cleared
- No cross-device sync
- ~5-10MB storage limit

**Execution:**
- No real LLM calls - outputs are random lorem ipsum text
- No token counting - random values
- No cost accuracy - no pricing table
- No retry logic - mock execution always succeeds or randomly fails
- Single active run only - can't queue multiple runs

**Features Not Implemented:**
- No authentication - single user only
- No run history UI - only latest run visible
- No export (CSV/JSON)
- No prompt duplication
- No filters/search on results
- No multi-grader support (one grader max)
- No model parameter controls (temperature, max_tokens, etc.)
- No dataset pagination (first 50 rows only)

**UI Limitations:**
- No global loading indicators
- No undo/redo for prompt edits
- 500ms polling instead of Realtime (Phase 2 will use Supabase Realtime)

### Phase 2 (Will Address)

Phase 2 resolves:
- Real persistence with Supabase
- Actual LLM provider calls with accurate tokens/cost
- Multi-user with authentication and RLS
- Realtime cell updates via Supabase subscriptions
- Retry logic with exponential backoff
- Run history and version navigation

### Post-Phase 2 (Deferred)

Future enhancements:
- Multi-grader support
- Model parameter controls
- Export results
- Prompt/run duplication
- Advanced filtering and search
- Diff view between prompt versions
- Multi-user collaboration
- Projects/collections organization

---

*Last updated: 2025-10-26*
