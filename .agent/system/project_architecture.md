# Project Architecture

## Project Overview

**Name**: Prompt Refinement UI
**Version**: 0.1.0 (Phase 1 - Frontend MVP)
**Goal**: A front-first MVP for iterating on LLM prompt refinement with a clean path to a Supabase/server backend.

**Current Status**: Phase 1 complete - UI-only implementation with mock data layer. Backend integration scheduled for Phase 2.

### What This System Does

This is a **single-user prompt testing and refinement tool** that allows you to:
- Edit and version **generator prompts** (produce outputs) and **grader prompts** (evaluate outputs)
- Run prompts against **multiple LLM models** side-by-side (OpenAI, Anthropic, etc.)
- Execute prompts across entire **datasets** (CSV/JSON) with variable substitution
- Compare results with **multiple metrics**: grade (pass/fail scores), tokens (input/output), cost, latency
- Manually grade outputs or use automated grader prompts
- Re-run individual cells with cache bypass
- Track prompt versions automatically on each run

---

## Tech Stack

### Frontend (Current - Phase 1)
- **Framework**: Next.js 14 (App Router)
- **React**: 18.3.1
- **TypeScript**: 5.3.3
- **Styling**: Tailwind CSS 3.4.1 with custom design tokens
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Code Editor**: CodeMirror 6 (via @uiw/react-codemirror)
- **Icons**: lucide-react
- **Testing**: Jest + React Testing Library
- **Component Development**: Storybook 9.1.15

#### Design System
- **Background**: `#FAFAFA` (neutral-50)
- **Primary Accent**: `#8685ef` (purple-500)
- **Secondary Accents**: `#faf8ff` (purple-50), `#dedbee` (purple-100)
- **Single Light Theme**: Creamy background aesthetic
- **Animations**: Custom spring transitions (300ms), fade transitions (150ms)

### Backend (Planned - Phase 2)
- **Database**: Supabase (Postgres + Realtime)
- **Auth**: Supabase Auth (OAuth/magic link)
- **API**: Vercel serverless routes or Supabase Edge Functions
- **Storage**: Supabase Storage (for large datasets)
- **Provider Integration**: OpenAI SDK, Anthropic SDK
- **Queue/Workers**: Async job execution with retry logic
- **Secrets**: Supabase Vault for encrypted API key storage

---

## Project Structure

```
/
├── frontend/               # Next.js application (Phase 1 complete)
│   ├── app/               # Next.js App Router
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Main page (two-panel layout orchestration)
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui primitives (button, modal, dropdown, etc.)
│   │   ├── EditorPanel.tsx          # Left panel: prompt editing
│   │   ├── PromptEditor.tsx         # CodeMirror wrapper
│   │   ├── DatasetSelector.tsx      # Dataset preview modal
│   │   ├── ResultsGrid.tsx          # Right panel: results table
│   │   └── __tests__/               # Component unit tests
│   ├── lib/               # Utilities and data layer
│   │   ├── types.ts                 # TypeScript interfaces (PERMANENT)
│   │   ├── utils.ts                 # Helper functions (PERMANENT)
│   │   ├── mockRepo.temp.ts         # TEMPORARY: localStorage CRUD (Phase 1 only)
│   │   └── mockRunExecutor.temp.ts  # TEMPORARY: Mock async execution (Phase 1 only)
│   ├── stories/           # Storybook stories
│   ├── styles/            # Global styles
│   └── public/            # Static assets
├── backend/               # EMPTY PLACEHOLDER (Phase 2)
│   └── README.md         # Future structure documentation
├── .agent/                # Project documentation (YOU ARE HERE)
│   ├── system/           # Architecture and technical docs
│   └── tasks/            # Feature PRDs and implementation plans
├── specs.md              # Complete product specification
└── package.json          # Workspace root scripts
```

---

## Core Concepts

### 1. Prompts
**Two types:**
- **Generator**: Produces outputs from inputs
- **Grader**: Evaluates generator outputs and assigns scores (0.0 to 1.0)

**Properties:**
- Name (editable inline)
- Type (generator/grader)
- Text content (with variable placeholders like `{{username}}`)
- Expected output format (auto-detected from content)
- Version counter (increments on run when text changed)
- Timestamps (created_at, updated_at)

**Expected Output Detection (Automatic):**
- If prompt contains `<response>` tags → expect response section
- If prompt contains "json" (case-insensitive) → expect valid JSON
- If both → validate response first, then JSON
- Validation failures mark cells as **Malformed**

### 2. Datasets
**Purpose:** Provide variable values for bulk prompt execution

**Properties:**
- Name
- Source (upload or manual)
- Headers (column names matching `{{placeholders}}`)
- Rows (first 50 stored for preview)
- Row count

**Formats Supported:**
- CSV (with headers)
- JSON (array of objects)

### 3. Models
**Global Registry:** Reusable model configurations across runs

**Properties:**
- Provider (e.g., "OpenAI", "Anthropic")
- Model name (e.g., "gpt-4", "claude-3-opus")
- Unique ID

**UI Behavior:**
- Max 4 models per run
- Models managed via embedded table interface
- Duplicate models allowed in different columns (via `column_index`)

### 4. Runs
**Execution Unit:** One prompt + one dataset + multiple models

**Properties:**
- Prompt ID and version label (e.g., "Generator 6")
- Dataset ID (nullable)
- Model IDs array (ordered by column position)
- Grader ID (optional)
- Created timestamp

**Execution Flow:**
1. Validate placeholders against dataset headers
2. Create run record
3. Generate cells for each (model × dataset row) pair
4. Execute cells asynchronously with mock delays (Phase 1)
5. If grader selected, run grader on each completed generator cell
6. Update UI in real-time (polling in Phase 1, Realtime in Phase 2)

**Constraints:**
- Only one active run at a time (enforced by `activeRunId`)
- Run button disabled during active execution

### 5. Cells
**Result Unit:** One model's output for one dataset row

**Properties:**
- Run ID, model ID, column index, row index
- Status: `idle | running | ok | error | malformed`
- Raw output (full text from provider)
- Parsed output (extracted `<response>` or JSON)
- Token counts (input/output)
- Cost (calculated from tokens × pricing)
- Latency (milliseconds)
- Error message (if failed)
- Graded value (0..1, from grader)
- Grader raw/parsed output
- Manual grade (0..1, user toggle)

**Cell States:**
- **idle**: Not yet started
- **running**: In progress (animated skeleton)
- **ok**: Success (white background)
- **error**: Failed (red border, error message)
- **malformed**: Invalid output format (yellow background)

---

## UI Layout

### Two-Panel Design

#### Left Panel: Editor (30% balanced / 65% focus)
**Components:**
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

#### Right Panel: Results (70% balanced / 35% focus)
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

## State Management

### Data Layer (Phase 1 - TEMPORARY)

**Location:** `frontend/lib/mockRepo.temp.ts`

**Storage:** localStorage (key-value pairs)

**Collections:**
- `prompts`: Prompt records
- `models`: Model registry
- `datasets`: Dataset metadata + preview rows
- `runs`: Run records
- `cells`: Cell results (keyed by `run_id:column_index:row_index`)
- `ui_state`: Active run ID

**CRUD Operations:**
- `getAllPrompts()`, `getPromptById()`, `createPrompt()`, `updatePrompt()`, `deletePrompt()`
- `getAllModels()`, `createModel()`, `deleteModel()`, `deduplicateModels()`
- `getAllDatasets()`, `createDataset()`
- `createRun()`, `getRunById()`
- `createCell()`, `getCellsByRunId()`, `updateCell()`
- `getUIState()`, `setActiveRunId()`

**Seed Data:**
- 2 pre-populated prompts (1 generator, 1 grader)
- 3 models (OpenAI, Anthropic variants)
- 1 sample dataset

### Mock Execution (Phase 1 - TEMPORARY)

**Location:** `frontend/lib/mockRunExecutor.temp.ts`

**Behavior:**
- Simulates async per-cell generation with 1-3 second random delays
- Generates random outputs with lorem ipsum text
- Adds random metadata (tokens, cost, latency)
- Runs grader with random scores (0.0 to 1.0)
- Updates cells via `updateCell()` with 500ms polling
- Enforces single active run (via `activeRunId`)
- Supports per-cell re-run (cache bypass simulation)

**Key Functions:**
- `executeRun()`: Main execution entry point
- `rerunCell()`: Individual cell re-execution

### Permanent Data Contracts

**Location:** `frontend/lib/types.ts`

**Interfaces (Will persist to Phase 2):**
```typescript
- Prompt
- Dataset
- Model
- Run
- Cell
- UIState
- PromptType: 'generator' | 'grader'
- CellStatus: 'idle' | 'running' | 'ok' | 'error' | 'malformed'
- MetricView: 'grade' | 'tokens' | 'cost' | 'latency'
- ExpectedOutput: 'none' | 'response' | 'json'
```

---

## Key Interactions

### Prompt Versioning
- **On text edit + blur**: Save changes, no version bump
- **On Run click**: Increment version counter **only if text changed since last run**
- **On rename**: Reset version counter to 1

### Dataset Validation
- **Generator run**: All `{{placeholders}}` in prompt must exist in dataset headers
- **Grader run**: All `{{placeholders}}` in grader must exist in (dataset headers + `{{generator_output}}`)
- Extra dataset columns ignored (no error)
- Validation errors shown in modal dialog (blocks run)

### Manual Grading
- **When no grader selected**: Grade view shows thumbs up/down icon
- **Click to cycle**: null → green (1.0) → red (0.0) → green
- **Manual grades override auto-grades** in summary calculations
- **Persisted per cell** in `manual_grade` field

### Cell Re-run
- **Only available during active run** (not for historical views)
- **Hover cell**: Shows reload button in top-right
- **Click reload**: Bypasses cache, overwrites cell with new result
- **Triggers**: New mock execution for that specific cell

### Metric Cycling
- **Click metric button**: Cycles through Grade → Tokens → Cost → Latency
- **Fade animation**: 150ms opacity transition
- **Badge updates**: All cell badges and summary row update
- **Not persisted**: Defaults to Grade on page load

---

## TEMPORARY vs PERMANENT Components

### TEMPORARY (Phase 1 only - Delete in Phase 2)

**Files marked `*.temp.ts`:**
1. **`frontend/lib/mockRepo.temp.ts`**
   - localStorage CRUD operations
   - Seed data initialization
   - Will be replaced by Supabase client + API calls

2. **`frontend/lib/mockRunExecutor.temp.ts`**
   - Simulated async execution with random delays
   - Mock output generation
   - Will be replaced by backend API + worker queue

**Why temporary?**
- Allows full UI development without backend dependency
- Matches final data contracts (same interfaces)
- Minimal refactor required for Phase 2 migration

### PERMANENT (Stays through Phase 2+)

**Core Application:**
- `frontend/app/page.tsx` - Main orchestration (minor API call updates)
- `frontend/components/` - All UI components (minimal changes)
- `frontend/lib/types.ts` - TypeScript interfaces (unchanged)
- `frontend/lib/utils.ts` - Helper functions (mostly unchanged)

**Design System:**
- `frontend/components/ui/` - shadcn/ui primitives
- `frontend/tailwind.config.ts` - Design tokens
- `frontend/styles/` - Global styles

**Testing & Tooling:**
- `frontend/__tests__/` - Component tests (expand in Phase 2)
- `frontend/stories/` - Storybook stories
- `.storybook/` - Storybook config

**Why permanent?**
- UI logic independent of data source
- TypeScript interfaces match backend schema
- Component contracts remain stable

---

## Phase 2 Migration Plan

### What Gets Replaced

1. **Remove temp files:**
   ```bash
   rm frontend/lib/mockRepo.temp.ts
   rm frontend/lib/mockRepo.temp.test.ts
   rm frontend/lib/mockRunExecutor.temp.ts
   ```

2. **Add Supabase client:**
   - Install `@supabase/supabase-js`
   - Create `frontend/lib/supabase.ts` with client initialization
   - Add environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

3. **Replace CRUD operations:**
   - `mockRepo.temp.ts` functions → Supabase client calls
   - Add RLS policies for multi-user support
   - Wire authentication flow

4. **Replace execution:**
   - `executeRun()` → `POST /api/runs` endpoint
   - 500ms polling → Supabase Realtime subscriptions
   - `rerunCell()` → `POST /api/cell/rerun` endpoint

5. **Backend implementation:**
   - Database schema migrations
   - Provider adapters (OpenAI, Anthropic)
   - Worker queue with retry/backoff
   - Cost calculation from pricing table
   - Cache layer (keyed by prompt+model+input hash)

### What Stays Unchanged

- All UI components (EditorPanel, ResultsGrid, etc.)
- TypeScript interfaces in `types.ts`
- Utility functions in `utils.ts` (parseOutput, formatTokens, etc.)
- Design system and styling
- Component tests (expand with backend integration tests)

### Estimated Changes

- **Lines of code to replace**: ~400 (both temp files)
- **New backend code**: ~2000 lines
- **UI code updates**: <100 lines (API call syntax, auth wrappers)
- **Migration time**: 2-3 days for experienced developer

---

## Testing Strategy

### Phase 1 (Current)
- **Unit tests**: Component logic (EditorPanel, ResultsGrid)
- **Integration tests**: Full page interactions (run execution, grading)
- **Test files**: `frontend/components/__tests__/*.test.tsx`
- **Coverage focus**: UI state management, user interactions, validation logic

### Phase 2 (Future)
- **API integration tests**: Real Supabase calls with test database
- **Provider adapter tests**: Mock OpenAI/Anthropic responses
- **End-to-end tests**: Cypress for full user flows
- **Performance tests**: Load testing for concurrent runs
- **Security tests**: RLS policy validation, API key encryption

---

## Known Limitations (Phase 1)

### Not Implemented
- **No authentication**: Single-user, no login required
- **No persistence between sessions**: localStorage only (unless browser cache cleared)
- **No real LLM calls**: Outputs are randomly generated text
- **No cost accuracy**: Random cost values (no pricing table)
- **No run history UI**: Only latest run visible
- **No real caching**: Cache bypass is simulated
- **No retry logic**: Mock execution always succeeds or randomly fails
- **No concurrent runs**: Single active run enforced

### Deferred Features (Post-Phase 2)
- Multi-grader support (one grader per run max currently)
- Model parameter controls (temperature, max_tokens, etc.)
- Export results to CSV/JSON
- Prompt duplication
- Run filtering/search
- Diff view between prompt versions
- Pricing management UI
- Multiple API keys per provider

---

## Performance Considerations

### Phase 1
- **localStorage limits**: ~5-10MB per domain (adequate for testing)
- **Large datasets**: Only first 50 rows stored (prevents memory issues)
- **Mock execution**: Throttled to prevent UI lockup
- **Animations**: Hardware-accelerated transforms (GPU)

### Phase 2 Optimizations
- **Realtime subscriptions**: Only active run cells (reduces bandwidth)
- **Pagination**: Large result sets chunked
- **Lazy loading**: Historical runs loaded on demand
- **Worker concurrency**: Configurable per-user rate limits
- **Cache eviction**: TTL-based cleanup (prevent database bloat)

---

## Security Notes (Phase 2)

- **RLS Policies**: All tables filtered by `user_id = auth.uid()`
- **API Key Storage**: Encrypted at rest using Supabase Vault
- **API Keys Never Client-Side**: Backend signs all provider requests
- **Rate Limiting**: Per-user throttling to prevent abuse
- **Input Validation**: All user inputs sanitized before execution
- **CORS**: Strict origin policies for API endpoints

---

## Deployment

### Phase 1
- **Frontend only**: Deploy to Vercel
- **Environment**: Production (no backend dependency)
- **URL**: TBD

### Phase 2
- **Frontend**: Vercel (Next.js)
- **Backend**: Supabase (database + Edge Functions) OR Vercel serverless
- **Storage**: Supabase Storage (datasets)
- **Secrets**: Vercel environment variables + Supabase Vault

---

## Key Dependencies

### Production
- `next` 14.1.0 - Framework
- `react` 18.3.1 - UI library
- `@uiw/react-codemirror` 4.25.2 - Code editor
- `@radix-ui/*` - UI primitives (via shadcn/ui)
- `tailwindcss` 3.4.1 - Styling
- `lucide-react` 0.546.0 - Icons

### Development
- `typescript` 5.3.3
- `jest` 29.7.0 - Testing
- `@testing-library/react` 14.1.2 - Component testing
- `storybook` 9.1.15 - Component development

### Future (Phase 2)
- `@supabase/supabase-js` - Database client
- `openai` - OpenAI SDK
- `@anthropic-ai/sdk` - Anthropic SDK

---

## Related Documentation

- [Complete Specification](../../specs.md) - Full product requirements
- [Frontend Proposal](../../frontend-unit-tests-proposal.md) - Testing strategy
- [Backend Placeholder](../../backend/README.md) - Phase 2 structure
- [Design Context](../../design-context.yaml) - Design system tokens
