# Prompt Refinement UI - Implementation Plan

## Executive Summary

This plan breaks down the Prompt Refinement UI into small, testable, iterative steps. **Phase 1 is UI-only** with localStorage mocking—this is our hard stop for validation with Edu before any backend work begins.

---

## Phase 1 Key Requirements (UI-First)

### Critical Implementation Details

1. **Expected Output Mode**
   Each prompt/grader has `Expected Output: None | <response> | JSON`. If set and parse fails, mark cell **Malformed**, badge red, and fail binary grade.

2. **Default Metric View**
   Metric view defaults to **Grade** on load; not persisted.

3. **Single Active Run**
   Only one run (live or dataset) can be active. While any cell in that run is `running`, the Run button is disabled and shows **“Loading…”** (shadcn Button+Spinner).

4. **Rename Semantics**
   Renaming a prompt/grader resets its version & run counters to **1**.

5. **Tokens Display Format**
   Tokens view format: `input | output` (e.g., `12k | 0.5k`).

6. **Color Scale Mapping**
   Grades normalized 0..1; Yes=1.0 (green), No=0.0 (red), 1–5 interpolated linearly.

7. **Parsed/Full View (Global)**
   Grid toolbar toggle between **Full Output** and **Parsed Response**; applies to **all cells**. No per-cell toggle.

8. **Malformed Influences Grade**
   If output is Malformed under an expected mode, show red badge and count as fail in Grade view.

9. **Grader Variable Validation**
   Grader placeholders can reference dataset headers **and** generator `{{output}}` placeholder.

10. **Historical View**
    History is read-only; re-run buttons and overlays are disabled and the view is clearly labeled.

11. **Summary Policy**
    Summary row shows **averages for all metrics**.

    * **Grade**: average
    * **Tokens**: **avg_in | avg_out**
    * **Cost**: average
    * **Latency**: average
      Footer label: **“Summary (Average)”**.

### Scope Constraints (Phase 1 Only)

* **NO pricing UI page** (costs are mocked; pricing table deferred to Phase 2)
* **NO mobile responsive layout** (desktop-first; mobile deferred to Phase 2)
* **NO dataset management page** (selector + preview-on-click sufficient for validation)
* **NO backend integration** (localStorage only; all API calls mocked)
* **NO deep-linking history route** (use tabs instead)

### Performance Guardrails

* **Large Dataset Handling**: Test with 100–200 rows × 3 models; ensure no UI jank.
* **localStorage Limits**: Cap mock response length to 10–20 KB per cell to avoid quota issues.
* **Version Bump Logic**: Only on Run, not on edit; test rename → counter reset → Run increments.

---

## High-Level Blueprint

### Phase 1: UI-Only with localStorage Mock (MILESTONE 1 - Hard Stop)

Build a fully functional UI with all interactions working against localStorage. This validates the UX, layout, and user flows before investing in backend infrastructure.

**Deliverable**: Complete working UI that Edu can test and refine.

### Phase 2: Backend Integration (AFTER Phase 1 approval)

Replace localStorage mock with Supabase backend, add auth, API key management, real provider calls.

### Phase 3: Hardening (AFTER Phase 2)

Add retry logic, caching, error handling, performance optimization.

---

## Phase 1 Breakdown: UI-Only Implementation

### Chunk 1: Foundation & Project Setup

**Goal**: Get a working Next.js project with Tailwind and shadcn/ui configured.

**Steps**

1. Initialize Next.js (App Router) + TypeScript (strict) + Tailwind.
2. Install and configure shadcn/ui (Button, Input, Dialog, Tooltip, Badge, DropdownMenu).
3. Set custom palette (#FAFAFA bg, accents #8685ef, #faf8ff, #dedbee).
4. Create two-panel layout (Left: Editor, Right: Results; desktop-first).
5. Create localStorage repository layer with TypeScript interfaces.

**Tests**

* Project builds.
* Tailwind classes apply.
* shadcn components render.
* Two-panel layout renders (desktop).
* localStorage read/write works.

---

### Chunk 2: State Management & Repository Layer

**Goal**: Implement the full state shape in localStorage with CRUD operations.

**Steps**

1. Define TS types: Prompt, Dataset, Run, Cell, Model, UIState.
2. PromptRepository CRUD.
3. DatasetRepository CRUD.
4. RunRepository CRUD.
5. CellRepository keyed by `(run_id, model_id, row_index)`.
6. Seed data generator (2 prompts, 1 dataset, 1 run).

**Tests**

* CRUD for each entity.
* Seed data loads.
* Persists across reloads.
* Type safety enforced.

---

### Chunk 3: Editor Panel - Basic Prompt Editing

**Goal**: Create, edit, save prompts with automatic versioning.

**Steps**

1. `PromptEditor` textarea (markdown), autosave on blur (debounce 500ms).
2. `PromptHeader`: inline rename; type badge; version label (“Generator 6”).
3. `ExpectedOutputSelector`: None / `<response>` / JSON.
4. `PromptSelector`: dropdown to switch prompts; “New Prompt” dialog.
5. Rename resets version counter to 1 (repo enforces).

**Tests**

* Edits save on blur.
* Inline rename works & resets version counter.
* Switching works.
* Version displayed correctly.
* New prompt creation works.

---

### Chunk 4: Variable Detection & Dataset Selector

**Goal**: Detect `{{placeholders}}` and allow dataset selection & preview.

**Steps**

1. `extractPlaceholders()` util (regex, unique names).
2. `VariableChips` component (generator vs grader colors).
3. `DatasetSelector` dropdown.
4. CSV/JSON upload button (file picker).
5. Parse CSV → headers + rows (limit preview to 50).
6. Persist dataset; show **preview modal** on dataset name click.

**Tests**

* Placeholders detected reliably.
* Chips update as text changes.
* Dataset selector lists all.
* CSV parses; errors handled.
* Preview modal shows first 50 rows.

---

### Chunk 5: Grader Selector

**Goal**: Optional grader selection with variable chips.

**Steps**

1. `GraderSelector` lists type='grader' prompts; “No grader” option.
2. On select, show grader placeholders as purple chips.
3. Helper text notes grader runs after each generation and may use `{{output}}`.

**Tests**

* Only graders listed.
* Deselect works.
* Chips render separately.
* Helper text appears.

---

### Chunk 6: Model Column Management

**Goal**: Add/remove model columns for side-by-side comparison.

**Steps**

1. `ModelSelector` dialog (provider + model).
2. **Mock, minimal registry** (e.g., OpenAI: gpt-4, gpt-4-turbo; Anthropic: sonnet, opus). Clearly temporary.
3. `ModelColumn` header; remove (X) per column.
4. Start with one default model (gpt-4).
5. Cap at ~4 models (configurable).

**Tests**

* Add/remove columns.
* Default present.
* Cap enforced.

---

### Chunk 7: Run Validation & Execution Setup

**Goal**: Validate before run, create run, enforce single-active-run.

**Steps**

1. `validateRun()`

   * Generator placeholders ⊆ dataset headers (if dataset).
   * Grader placeholders ⊆ (dataset headers ∪ {`output`}).
   * Return array of errors.
2. Run button (shadcn Button with spinner).
3. CMD/CTRL+Enter triggers run.
4. On click:

   * If `ui.activeRunId !== null` → button disabled, label **“Loading…”**.
   * Else run `validateRun()`; show errors (toast) if any.
   * If valid:

     * Increment version_counter.
     * Create Run (store version_label).
     * Set `ui.activeRunId = run.id`.
5. One run is **active** while any cell is `running`. Re-run only for terminal cells of **that** run.

**Tests**

* Validation blocks & allows correctly.
* Version increments on run, not on edit.
* Active-run guard works.
* Button shows **“Loading…”** when active.

---

### Chunk 8: Results Grid - Basic Structure

**Goal**: Render grid and mock async population.

**Steps**

1. `ResultsGrid` with header (models) and rows (live=1 row; dataset=N).
2. `ResultCell` with loading skeleton.
3. Mock async execution per cell (random 500–2000ms).
4. On each cell completion: update status+metrics.
5. When **all** cells terminal → `ui.activeRunId = null`.

**Tests**

* Correct rows/columns.
* Skeletons show.
* Cells populate asynchronously.
* ActiveRunId clears at end.

---

### Chunk 9: Cell Content Display

**Goal**: Truncate, expand modal, global view only.

**Steps**

1. `parseOutput(raw, expectedOutput)` → `{ parsed, isMalformed }`.
2. `gradeNormalizer(response)` → 0..1 (Yes/No/1–5).
3. Cell displays **global-selected** view (Full or Parsed), truncated to 200 chars.
4. `CellExpandModal` shows **same global view** in full. No per-cell toggle.
5. If parse fails under expected mode → status `malformed`, warning badge, grade=fail in Grade view.

**Tests**

* Parsing works (response/JSON/none).
* Malformed flagged & affects grade.
* Modal mirrors global view.

---

### Chunk 10: Cell Overlays & Badges

**Goal**: Hover overlays with re-run and metric badges.

**Steps**

1. Hover overlay (top-right: re-run; bottom-right: metric badge).
2. Re-run only for **terminal cells of the active run**.
3. Metric badge reflects current metric view.

**Tests**

* Overlay shows/hides.
* Re-run regenerates data for that cell.
* Disabled in History.

---

### Chunk 11: Grader Integration

**Goal**: Auto-run grader and surface grade.

**Steps**

1. After generator cell OK, if grader selected → mock grader (300–800ms).
2. Grader output includes `<thinking>` & `<response>`.
3. Parse to numeric 0..1; store `graded_value`, `grader_full_raw`, `grader_parsed`.
4. Show **Grader badge** (color by grade).
   *Phase 1 keeps it simple: badge + tooltip snippet is enough; no flip interaction.*

**Tests**

* Grader runs and stores values.
* Badge color thresholds ok.
* Tooltip shows brief response snippet (optional).

---

### Chunk 12: Metric Views & Summary Row

**Goal**: Toggle metrics; summary shows **averages** for all.

**Steps**

1. Toolbar **MetricToggle** (Grade, Tokens, Cost, Latency); default Grade; not persisted.
2. Formatters:

   * Tokens: `"input | output"` with short scale.
   * Cost: `"$0.0023"`.
   * Latency: `"1.2s"`.
   * Grade: percentage.
3. Cell metric badge updates per view.
4. `SummaryRow` shows **averages for all**:

   * Tokens: **`avg_in | avg_out`**
   * Exclude error/malformed cells from averages.
5. Footer label: **“Summary (Average)”**.

**Tests**

* Toggle works.
* Badges update.
* Summary averages correct; tokens show avg_in | avg_out.
* Errors/malformed excluded.

---

### Chunk 13: Error Handling & Display

**Goal**: Clear errors & malformed signaling.

**Steps**

1. ~5% mock error rate: status `error`, message (“Rate limit exceeded”, “API timeout”, “Invalid key”).
2. ResultCell shows error icon + tooltip with raw message (red text).
3. Malformed shows warning icon + tooltip (“Failed to parse expected format”).
4. Summary excludes those cells.

**Tests**

* Errors appear, tooltips correct.
* Malformed tooltips correct.
* Summary excludes them.

---

### Chunk 14: Run History

**Goal**: View past runs and restore in read-only mode.

**Steps**

1. **Tabs** on main page (shadcn Tabs): “Current” / “History”.
2. History lists runs for current prompt (newest first). Display `${version_label}` and model count (avoid persisted timestamps in Phase 1).
3. Clicking a run loads its cells & shows grid in **Historical View**:

   * Banner “Historical View”
   * Overlays disabled
   * Re-run disabled
4. “Back to Current” returns to live view.

**Tests**

* List shows past runs.
* Historical grid loads & is read-only.
* Back navigation works.

---

### Chunk 15: Dataset Management Polish

> **Removed from Phase 1 per scope constraints.**
> Keep only selector + upload + preview-on-click.

---

### Chunk 16: Keyboard Shortcuts & UX Polish

**Goal**: Shortcuts, spinners, empty states, focus, tooltips.

**Steps**

1. CMD/CTRL+Enter → Run.
2. ESC closes modals.
3. Buttons show spinner with **“Loading…”** (Run, Upload).
4. Empty states:

   * No datasets → “Upload your first dataset”
   * No models → “Select at least one model”
   * No runs → “Run your first prompt”
5. Tooltips on icon buttons (re-run, delete, etc.).
6. Focus management (auto-focus editor; sensible tab order).
7. Onboarding placeholder in empty editor:

   ```
   Write your prompt here. Use {{variables}} for dynamic inputs.

   Example:
   You are a helpful assistant. The user asks: {{user_message}}
   Respond professionally.
   ```

**Tests**

* Shortcuts work.
* “Loading…” spinners appear.
* Empty states helpful.
* Tooltips visible.
* Focus behavior correct.
* Placeholder visible when empty.

---

### Chunk 17: End-to-End Testing & Integration

**Goal**: Verify full flow and performance with mocks.

**Steps**

1. E2E scenarios:

   * Create prompt → Add dataset → Run → View results
   * Add grader → Run with grader → Verify grades
   * Add 3 models → Run → Toggle metrics → Verify views
   * Re-run cell (active run only) → Verify update
   * View History → Load past run → Read-only view
2. Performance test:

   * Dataset 100 rows × 3 models
   * Ensure UI remains responsive during mock execution
3. Fix integration bugs; ensure no console errors.
4. Smooth animations (skeletons, modals, hover).

**Tests**

* All E2E pass.
* No console errors.
* Performance acceptable.
* Animations smooth.

---

## State Dependencies Map

```
Foundation (1)
  ↓
State Management (2)
  ↓
Editor Panel (3) → Variable Detection (4)
  ↓                        ↓
Grader Selector (5) ←──────┘
  ↓
Model Columns (6)
  ↓
Validation & Execution (7)
  ↓
Grid Structure (8)
  ↓
Cell Content (9)
  ↓
Overlays (10)
  ↓
Grader Integration (11)
  ↓
Metric Toggle + Summary (12)
  ↓
Errors (13)
  ↓
History (14)
  ↓
UX Polish (16)
  ↓
E2E (17)
```

Each chunk can only start after its dependencies are complete.

---

## Success Criteria for Phase 1 Completion

* [ ] Can create and edit prompts (generator and grader)
* [ ] Can upload and preview datasets
* [ ] Can select multiple models for comparison
* [ ] Can run prompts against datasets
* [ ] Results grid populates with mock data
* [ ] **Global** Parsed/Full toggle affects all cells (no per-cell toggle)
* [ ] **Summary (Average)** row shows averages for all metrics; **Tokens** as **avg_in | avg_out**
* [ ] Grader auto-runs; colored badge shown
* [ ] **Validation** blocks invalid runs with clear errors
* [ ] **Single Active Run** enforced; Run button shows **“Loading…”** while active
* [ ] **Re-run** allowed only for **terminal cells of the active run**; disabled in **History**
* [ ] **History** available via **tabs**, read-only (no overlays/re-run)
* [ ] Large datasets (100+ rows) perform without jank
* [ ] localStorage quota managed (10–20 KB per cell cap)
* [ ] All UI interactions feel smooth and complete
* [ ] No obvious bugs or broken states

**Hard stop**: Once these criteria are met, present to Edu for UI/UX feedback before starting Phase 2.

---

## Notes for Implementation

* **TDD approach**: Write failing tests first, then implement.
* **No orphaned code**: Every chunk integrates with previous work.
* **Mock data quality**: Varied lengths, some errors.
* **Incremental commits**: Commit after each chunk completion.
* **Component isolation**: Each component testable in isolation.
* **Type safety**: TypeScript strict mode throughout.

---

## Estimated Timeline (Phase 1 only)

* Chunks 1–2 (Foundation + State): ~2 prompts
* Chunks 3–5 (Editor + Variables + Grader): ~3 prompts
* Chunk 6 (Models): ~1–2 prompts
* Chunks 7–8 (Validation + Grid): ~2–3 prompts
* Chunks 9–10 (Cell Display + Overlays): ~2 prompts
* Chunk 11 (Grader Integration): ~1 prompt
* Chunk 12 (Metrics + Summary): ~1–2 prompts
* Chunks 13–17 (Errors + History + Polish + E2E): ~5 prompts

**Total**: ~18–20 prompts for complete Phase 1.

---

# Implementation Prompts for Code Generation LLM

Below are detailed prompts for each chunk (reflecting the final decisions). You can paste them directly into a code-gen LLM.

---

## Prompt 1: Foundation & Project Setup + State Management

```
You are building a Prompt Refinement UI - a tool for testing and comparing LLM prompts across different models.

CONTEXT: Starting from scratch.

TASK: Set up the Next.js project foundation and implement the complete state management layer with localStorage.

REQUIREMENTS:

1) Initialize Next.js 14+ project:
   - App Router
   - TypeScript (strict mode)
   - Tailwind CSS
   - Custom colors: background #FAFAFA, primary #8685ef, accent-light #faf8ff, accent-dark #dedbee

2) Install and configure shadcn/ui:
   - Components: Button, Input, Dialog, Tooltip, Badge, DropdownMenu
   - Ensure theme uses the custom palette

3) Create basic two-panel layout in frontend/app/page.tsx:
   - Left panel (≈40%): Editor and controls
   - Right panel (≈60%): Results grid
   - Desktop-only layout (mobile deferred)

4) Define TypeScript interfaces in frontend/lib/types.ts:
   type PromptType = 'generator' | 'grader';
   type CellStatus = 'idle' | 'running' | 'ok' | 'error' | 'malformed';
   type MetricView = 'grade' | 'tokens' | 'cost' | 'latency';
   type ExpectedOutput = 'none' | 'response' | 'json';

   interface Prompt {
     id: string;
     name: string;
     type: PromptType;
     text: string;
     expected_output: ExpectedOutput;
     version_counter: number;
     created_at: string;
     updated_at: string;
   }

   interface Dataset {
     id: string;
     name: string;
     source: 'upload' | 'manual';
     headers: string[];
     row_count: number;
     rows: Record<string, string>[]; // first 50 rows for preview
   }

   interface Model {
     id: string;
     provider: string;
     model: string;
   }

   interface Run {
     id: string;
     prompt_id: string;
     version_label: string;
     dataset_id: string | null;
     model_ids: string[];
     grader_id: string | null;
   }

   interface Cell {
     run_id: string;
     model_id: string;
     row_index: number;
     status: CellStatus;
     output_raw: string;
     output_parsed: string;
     tokens_in: number;
     tokens_out: number;
     cost: number;
     latency_ms: number;
     error_message: string | null;
     graded_value: number | null; // 0..1
     grader_full_raw: string | null;
     grader_parsed: string | null;
   }

   interface UIState {
     metricView: MetricView; // default 'grade'; not persisted
     showParsedOnly: boolean; // global Parsed/Full
     activeRunId: string | null; // single active run guard
   }

5) Implement TEMP repository: frontend/lib/mockRepo.temp.ts
   - CRUD for Prompts/Datasets/Runs/Cells, plus get/set UIState
   - Cells keyed `${run_id}:${model_id}:${row_index}`
   - generateId(prefix: string)
   - Version bump ONLY on run
   - Rename resets version_counter to 1
   - Auto-prune: keep last 50 runs per prompt

6) Seed data: initializeSeedData()
   - 2 prompts (1 generator with expected_output='response', 1 grader expected_output='none')
   - 1 dataset (10 rows; headers ["user_message","expected_tone"])

TESTS:
- Unit tests for mockRepo.temp.ts CRUD and utilities
- Persistence verified across reloads
- Seed data loads only once
- Types enforce correctness
- `npm run build` succeeds

DELIVERABLE:
A Next.js app in frontend/ that builds, shows the layout, and has a working mock repository with seed data.
```

---

## Prompt 2: Editor Panel - Basic Prompt Editing

```
CONTEXT: Foundation & state layer exist.

TASK: Build the left panel editor to create, edit, and switch prompts.

REQUIREMENTS:
1) components/PromptEditor.tsx
   - Textarea for markdown, controlled component
   - Autosave on blur (debounced 500ms) via updatePrompt()
   - Monospace; min-height ~300px; auto-expand

2) components/PromptHeader.tsx
   - Inline rename (Enter/blur to save)
   - Type badge (generator=blue, grader=purple)
   - Version label: "Generator 6" | "Grader 3"

3) components/ExpectedOutputSelector.tsx
   - Dropdown: None, <response>, JSON
   - Saves to prompt.expected_output
   - Helper: "If set, failed parse marks as Malformed"

4) components/PromptSelector.tsx
   - Dropdown listing prompts; include "New Prompt"
   - "New Prompt" dialog: name + type; expected_output='none'

5) Wire into app/page.tsx
   - Load last edited or first seed prompt
   - Render header, selector, editor

TESTS:
- Edits persist on blur
- Rename resets version counter to 1
- Switching works
- New prompt creation works
- Expected Output persists

DELIVERABLE:
Working left panel editor with rename, expected output selector, and prompt switching.
```

---

## Prompt 3: Variable Detection & Dataset Selector

```
CONTEXT: Editor exists.

TASK: Detect {{placeholders}} and let user choose/preview dataset.

REQUIREMENTS:
1) lib/utils.ts: extractPlaceholders(text: string): string[]
   - Regex: /\{\{([a-zA-Z0-9_]+)\}\}/g
   - Return unique names
   - Ignore malformed braces

2) components/VariableChips.tsx
   - Read-only chips
   - Generator vars = gray; Grader vars = purple

3) components/DatasetSelector.tsx
   - Dropdown of datasets (name + row count)
   - "No dataset" option

4) components/DatasetUpload.tsx
   - Upload CSV/JSON → parse → save dataset
   - Show success/error toasts

5) components/DatasetPreviewModal.tsx
   - Dialog; table of first 50 rows; scrollable body

6) UI placement
   - Variables under editor
   - Dataset selector with upload button
   - Click dataset name → open preview

TESTS:
- Placeholder detection
- Dataset list/selection
- Upload succeeds/fails correctly
- Preview modal renders 50 rows

DELIVERABLE:
Variables shown as chips; dataset selection & preview working.
```

---

## Prompt 4: Dataset Upload & Preview

```
CONTEXT: Dataset selector & preview wiring exist.

TASK: Implement CSV parsing + preview modal details.

REQUIREMENTS:
1) lib/utils.ts: parseCSV(file: File):
   - Use Papa Parse (or simple CSV logic)
   - Require headers
   - Return headers + first 50 rows
   - Throw clear errors on invalid input

2) DatasetUpload.tsx
   - Hidden file input + "Upload CSV" button
   - On parse success: createDataset()
   - Toasts for success/error

3) DatasetPreviewModal.tsx
   - Title = dataset name
   - shadcn Table
   - First 50 rows, scrollable

4) DatasetSelector.tsx
   - Click selected dataset name → open preview

TESTS:
- Correct parsing & error handling
- Modal opens from selector
- Rows cap to 50

DELIVERABLE:
Upload->parse->save->preview loop complete.
```

---

## Prompt 5: Grader Selector

```
CONTEXT: Editor + dataset ready.

TASK: Optional grader selection with its variables.

REQUIREMENTS:
1) components/GraderSelector.tsx
   - Only type='grader' prompts
   - "No grader" option
   - Persist selection

2) Show "Grader Variables" chips (purple)
   - Extract placeholders from grader text
   - Note if {{output}} present

3) Helper text: "Grader runs after each generation."

TESTS:
- Lists only graders
- Selection persists
- Chips render separately

DELIVERABLE:
Grader selection with variable visibility.
```

---

## Prompt 6: Model Selection

```
CONTEXT: Everything up to grader exists.

TASK: Allow selecting multiple model columns.

REQUIREMENTS:
1) lib/constants/models.ts (mock)
   export const MODEL_REGISTRY = {
     openai: { name: 'OpenAI', models: ['gpt-4', 'gpt-4-turbo'] },
     anthropic: { name: 'Anthropic', models: ['sonnet', 'opus'] }
   };

2) components/ModelSelector.tsx
   - Dialog with Provider dropdown -> filtered Model dropdown
   - "Add Model" button

3) components/ModelColumn.tsx
   - Header shows provider+model; X to remove

4) components/ModelColumns.tsx
   - Render all headers + "+ Add Model"

5) State
   - Initialize with one default: openai/gpt-4
   - Cap at ~4 (configurable)

TESTS:
- Add/remove works
- Default present
- Cap enforced

DELIVERABLE:
Manage model columns for comparison.
```

---

## Prompt 7: Run Validation & Execution

```
CONTEXT: Editor, dataset, grader, models ready.

TASK: Validate, create run, enforce single-active-run, set button state.

REQUIREMENTS:
1) lib/utils/validateRun.ts:
   - validateRun(prompt, dataset, grader): string[]
   - Generator vars ⊆ dataset.headers (if dataset)
   - Grader vars ⊆ dataset.headers ∪ ['output']
   - Return errors[]

2) components/RunButton.tsx
   - shadcn Button labeled "Run"
   - While running/blocked: shows spinner + text "Loading…"
   - Disabled when activeRunId is set

3) In app/page.tsx:
   - On Run click:
     - If activeRunId: do nothing (button disabled)
     - Else:
       - errors = validateRun(...)
       - If errors: show toast(s)
       - Else:
         - increment version_counter
         - create Run; set version_label `${prompt.type} ${version_counter}`
         - set activeRunId = run.id
         - kick off mock execution

4) Single Active Run rules:
   - Run is active while any cell is 'running'
   - Re-run allowed only for terminal cells of the active run
   - Historical view prohibits re-run

TESTS:
- Validation blocks with clear messages
- Version increments on run
- Button shows "Loading…" when active
- activeRunId set/cleared appropriately

DELIVERABLE:
Run creation & enforcement working.
```

---

## Prompt 8: Results Grid Structure & Mock Execution

```
CONTEXT: Runs can be created.

TASK: Render grid; populate cells asynchronously; clear activeRunId when done.

REQUIREMENTS:
1) components/ResultsGrid.tsx
   - Header = model columns
   - Rows = 1 (live) or dataset.row_count
   - Each cell renders ResultCell skeleton initially

2) lib/mock/generateMockCell.ts
   - Generate random output text (bounded to avoid big storage)
   - tokens_in/out, cost, latency_ms within realistic ranges
   - status 'ok'

3) lib/mock/mockExecute.ts
   - For each model × row:
     - setTimeout (500–2000ms)
     - generate mock cell
     - save via CellRepository
     - emit update to re-render

4) app/page.tsx run flow:
   - After creating run, call mockExecute(run, dataset)
   - When all cells terminal: activeRunId = null

TESTS:
- Grid renders correct shape
- Cells populate
- activeRunId clears

DELIVERABLE:
Asynchronous grid population with mock data.
```

---

## Prompt 9: Cell Content Display & Expand

```
CONTEXT: Cells now have data.

TASK: Display truncated content; modal shows full; global-only Parsed/Full.

REQUIREMENTS:
1) lib/utils/parseOutput.ts
   - parseOutput(raw, expected): { parsed: string | null, isMalformed: boolean }
   - 'none' => parsed=raw
   - 'response' => extract <response>…</response>
   - 'json' => JSON.parse attempt
   - Fail => isMalformed=true

2) lib/utils/gradeNormalizer.ts
   - "Yes" => 1.0; "No" => 0.0; 1–5 => (score-1)/4

3) components/ResultCell.tsx
   - Show truncated **global-selected** view (max 200 chars)
   - Malformed => status 'malformed' + warning badge + tooltip

4) components/CellExpandModal.tsx
   - Dialog showing the **same global-selected** view, full text

5) generateMockCell.ts improvements:
   - If expected='response', 80% include tags, 20% omit
   - If expected='json', 80% valid, 20% invalid
   - Respect size cap (≤10–20 KB)

TESTS:
- Parsing accurate
- Malformed flagged & counted as fail in Grade view
- Modal mirrors global view

DELIVERABLE:
Clean cell display with modal; malformed handling.
```

---

## Prompt 10: Cell Overlays & Badges

```
CONTEXT: Cells render outputs.

TASK: Add overlays for re-run and metric badges.

REQUIREMENTS:
1) Hover overlay
   - Top-right: Re-run icon
   - Bottom-right: Metric badge

2) Re-run rules
   - Only for terminal cells of the active run
   - On click: status 'running' → regenerate mock → update

3) Metric badge content follows active metric:
   - Grade / Tokens / Cost / Latency

TESTS:
- Hover shows overlay
- Re-run regenerates data
- Disabled in History

DELIVERABLE:
Cell overlays with functional re-run and metric badge.
```

---

## Prompt 11: Grader Integration

```
CONTEXT: Generator cells complete.

TASK: Auto-run grader, compute numeric grade, show badge.

REQUIREMENTS:
1) lib/mock/generateMockGrader.ts
   - Returns output string with <thinking> and <response>
   - Distribution: ~50% Yes, ~30% No, ~20% 1–5

2) mockExecute.ts (grader step)
   - After generator OK and grader selected:
     - setTimeout 300–800ms
     - Generate grader output
     - Parse to 0..1; set graded_value, grader_full_raw, grader_parsed

3) components/GraderBadge.tsx
   - Color thresholds: [0..0.4]=red, (0.4..0.7]=yellow, (0.7..1]=green
   - Tooltip may show brief <response> snippet

4) ResultCell integration
   - Show GraderBadge if graded_value present
   - No flip interaction in Phase 1 (keep simple)

TESTS:
- Grader runs and persists values
- Badge colors correct
- Tooltip optional but stable

DELIVERABLE:
Grades surfaced with badge; simple UX.
```

---

## Prompt 12: Metric Views & Summary Row

```
CONTEXT: Metrics exist per cell.

TASK: Toggle metric view; compute averages-only summary.

REQUIREMENTS:
1) components/MetricToggle.tsx
   - 4 buttons: Grade, Tokens, Cost, Latency
   - Default 'Grade'; not persisted

2) lib/utils/formatters.ts
   - formatTokens(in, out) => "input | output" with k-shortening
   - formatCost(cost) => "$0.0023"
   - formatLatency(ms) => "1.2s"
   - formatGrade(grade) => "85%"

3) components/CellOverlay.tsx
   - Metric badge shows:
     - Grade: percentage
     - Tokens: formatTokens
     - Cost: formatCost
     - Latency: formatLatency

4) components/SummaryRow.tsx
   - **Averages for all** metrics
   - Tokens as **avg_in | avg_out**
   - Exclude error/malformed
   - Footer label: "Summary (Average)"

TESTS:
- Toggle switches views
- Cell badges update
- Summary averages correct (tokens avg_in|avg_out)
- Errors/malformed excluded

DELIVERABLE:
Metric toggle + averages-only summary row.
```

---

## Prompt 13: Error Handling & Display

```
CONTEXT: Execution can fail.

TASK: Surface error states and tooltips; exclude from averages.

REQUIREMENTS:
1) generateMockCell.ts: ~5% errors (status 'error', message)
2) ResultCell:
   - Error icon + tooltip (red text)
   - Malformed icon + tooltip (yellow text)

3) Summary:
   - Exclude error/malformed from averages

TESTS:
- Errors appear randomly
- Tooltips show raw messages
- Summary excludes them

DELIVERABLE:
Clear error/malformed visualization.
```

---

## Prompt 14: Run History

```
CONTEXT: Users need to inspect past runs.

TASK: Tabs-based History (no deep links), read-only.

REQUIREMENTS:
1) shadcn Tabs on main page: "Current" / "History"
2) HistoryTab lists runs for current prompt (newest first)
   - Title: version_label
   - Subtitle: model count (omit timestamps for Phase 1)

3) On click:
   - Load run and cells
   - Show grid in Historical View:
     - Banner "Historical View"
     - Overlays disabled
     - Re-run disabled

4) Back to Current:
   - Return to live editing view

TESTS:
- List renders in order
- Historical grid loads & is read-only
- Back to Current works

DELIVERABLE:
Simple, reliable history via tabs.
```

---

## Prompt 16: UX Polish & Keyboard Shortcuts

```
CONTEXT: Core features are in.

TASK: Add polish, shortcuts, spinners, empty states.

REQUIREMENTS:
1) Shortcuts:
   - CMD/CTRL+Enter => Run
   - ESC => Close modals

2) Loading:
   - Buttons show spinner and text "Loading…" while active
   - Run button disabled when activeRunId set

3) Empty states:
   - No datasets/models/runs messages

4) Tooltips:
   - For icon buttons (re-run, delete, etc.)

5) Focus management:
   - Auto-focus editor on load
   - Logical tab order
   - Auto-focus inputs in dialogs

6) Onboarding placeholder (see text in plan)

TESTS:
- Shortcuts work
- "Loading…" appears
- Empty states visible
- Tooltips OK
- Focus behavior OK

DELIVERABLE:
Polished UX consistent with design rules.
```

---

## Prompt 17: End-to-End Testing & Final Integration

```
CONTEXT: Everything wired.

TASK: E2E and performance validation with mocks.

REQUIREMENTS:
1) Set up Playwright or Cypress
   - Test IDs for key elements
   - LocalStorage reset/mocking between tests

2) Scenarios:
   - Create prompt → Upload dataset → Run → Results
   - Add grader → Run → Badge visible (grade present)
   - Add 3 models → Run → Toggle metrics → Summary "Summary (Average)"
   - Re-run a terminal cell (active run) → Data updates
   - Switch to History → Load past run → Read-only (no overlays/re-run)

3) Performance:
   - 100 rows × 3 models
   - UI stays responsive

4) Fix integration issues; ensure no console errors.
5) Smooth animations (skeletons, dialogs, hover).

TESTS:
- All pass; no console errors
- Performance acceptable

DELIVERABLE:
Shippable Phase 1 UI.
```

