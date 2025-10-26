# Spec: Prompt Refinement UI (v1)

Goal: ship a **front-first** MVP you can iterate on, with a clean path to a Supabase/Server backend.
Scope: single-user UI that edits/runs **prompts** (generators) and **graders**, compares **models** side-by-side, runs **datasets** asynchronously, and shows **stats** (grade, tokens, cost, latency).

---

# Frontend (Next.js + React + Tailwind + shadcn/ui)

## Tech

* Framework: **Next.js (App Router)**, **React 18**
* Styling: **Tailwind**, custom palette (background `#FAFAFA`, accents `#8685ef`, `#faf8ff`, `#dedbee`)
* Components: **shadcn/ui** (Button, Modal, Dropdown, Badge, Spinner, Kbd)
* Editor: **CodeMirror** via `@uiw/react-codemirror` with custom theme, line numbers, syntax highlighting for `{{variables}}`, `<tags>`, "json" keyword, indentation-based folding, and Ctrl+Shift+Z wrap toggle
* Keyboard: `CMD/Ctrl + Enter` triggers **Run**
* Theme: single light theme (creamy background)
* Realtime (later): Supabase Realtime; for v1 UI-first, mock/local store with 500ms polling

## Core Concepts

* **Prompt**: either `generator` or `grader` (type tag). Automatic version bump **on run** only (and only if text changed since last run).
* **Run**: execution of a single **prompt** against **one or more models**.

  * **Dataset run** (per row input substitution). Dataset is **optional** when prompt has no `{{variables}}`; required when placeholders exist.
  * **Async** execution; results stream into each model **column** as ready.
* **Dataset**: CSV/JSON with headers; used to fill `{{placeholders}}` in prompts/graders.
* **Expected Output Detection**: Automatic detection based on prompt content (not a UI setting):
  * If prompt contains `<response>` tags → parse and validate response section
  * If prompt contains the word "json" (case-insensitive) → validate as JSON
  * If both → validate response first, then JSON
  * Validation failures mark cell as **Malformed** (backend logic)

## UX Layout (Two-Panel)

**Left Panel (Editor/Setup)** — 30% width in balanced mode, 65% in focus mode

* Prompt header: name (editable inline), version label (e.g., "v6") — no type badge displayed
* Prompt dropdown menu: Create new prompt, switch between existing prompts
* **CodeMirror editor** with line numbers, syntax highlighting for `{{variables}}`, `<tags>`, and "json" keyword
  * Autosave **on blur** (text changes only; no version bump)
  * Ctrl+Shift+Z toggles line wrapping
* Variables section:

  * Detected placeholders (from prompt text), read-only purple chips showing `{{variable_name}}`
* Dataset preview (read-only):

  * Shows currently active dataset name and row count (set via toolbar upload)
  * **Preview button** → opens modal showing first 50 rows in table format
  * No dataset selection UI here; selection happens indirectly via uploads in right panel toolbar
* **Run button** overlaid on bottom-right of editor (disabled when run active or no models selected)

**Right Panel (Results + Toolbar)** — 70% width in balanced mode, 35% in focus mode

* **Top Toolbar** (above results grid):

  * **Metric cycling button** (purple pill): Click to cycle Grade → Tokens → Cost → Latency (with fade animation)
  * **Grader selector dropdown** (purple pill, flask icon when none selected): Choose grader prompt or "No grader"
  * **Upload dataset button** (purple pill, upload icon): Select CSV/JSON file; shows spinner while parsing
  * Toast notifications for upload success/errors (auto-dismiss after 3s)

* **Results Grid** (table layout):

  * **Header row**:
    * "Row" column (56px fixed width)
    * Model columns (310px fixed width each, max 4 models)
    * Model headers show "Provider / Model" and are clickable to edit
    * Hover reveals "×" button to remove model (minimum 1 model required)
  * **Data rows**: One row per dataset entry
    * Row index column (gray background)
    * Model cells show truncated output (200 chars), click to expand in modal
  * **Summary row**: Shows averages per column for current metric

* **Model Management** (embedded in grid):

  * **"+" button** to right of table adds new model column (opens provider/model selector modal)
  * Models can be edited by clicking header (opens same modal)
  * Column index architecture allows duplicate models in different columns

* **Cell Features**:

  * Click cell → expand full output in modal with metadata (tokens, cost, latency, grade)
  * **Hover overlay** (only during active run): Shows re-run button in top-right
  * **Bottom-right badge** shows current metric (Grade/Tokens/Cost/Latency):
    * **Grade view with grader**: Colored badge (red/yellow/green), click to toggle grader overlay showing grader's full output in cell
    * **Grade view without grader**: Thumbs up/down icon, click to manually toggle pass/fail (green/red/neutral)
    * **Other metrics**: Non-interactive badge showing value
  * **Re-run** bypasses cache and overwrites cell (only available during active run, not for historical runs)
  * Loading state: Animated skeleton (3 pulsing gray bars)
  * Error state: White background with red border, shows error message
  * Malformed state: Warning-yellow background, shows output (backend detected validation failure)

## Interactions & Rules

* **Automatic versioning**: On clicking Run, prompt version increments **only if text changed since last run** (e.g., "v5" → "v6"). Text edits before running do **not** increment version.
* **Dynamic view modes**:

  * **Focus mode** (65% left / 35% right): Auto-triggers when editor gains focus
  * **Balanced mode** (30% left / 70% right): Auto-triggers when editor loses focus OR when Run is clicked
  * Smooth 300ms spring animation between modes
  * Current mode persisted to localStorage

* **Grader**:

  * Optional. Selected via dropdown in right panel toolbar.
  * If selected, auto-runs after each generator cell completes.
  * Same protocol as generator: supports `<thinking>` and `<response>`, same parsing logic.

* **Manual grading**:

  * When **no grader** is selected, grade view shows thumbs up/down icon on cells
  * Click to cycle: null → green (pass, 1.0) → red (fail, 0.0) → green
  * Manual grades take precedence over auto-grades in summary calculations
  * Manual grades persist per cell

* **Caching**:

  * Default: cache by `(prompt_id, model_id, input_hash)` (backend implementation)
  * Cell **Re-run** bypasses cache and overwrites result
  * Re-run only available during active run (not for historical views)

* **Validation** (at run-time only):

  * **Generator**: all placeholders must exist in dataset headers (if prompt has placeholders; otherwise dataset is optional)
  * **Grader** (if selected): placeholders must exist across **(dataset headers + generator output placeholder)**
  * Extra dataset columns are ignored (no penalty)
  * Validation errors shown in modal dialog (not toast/banner)

* **Stats/Colors**:

  * Metric view cycles through: Grade → Tokens → Cost → Latency
  * Per-cell badge and summary row update with 150ms fade animation
  * Grade color scale (unified): **0.0=red**, **1.0=green**, numerics map to 0..1 gradient
  * Tokens display as `input | output` (e.g., `12k | 0.5k`)

* **Renaming**:

  * Click prompt name to rename inline (Enter to confirm, Escape to cancel)
  * Renaming resets **version counter to 1**

* **Deletion**:

  * Permanent (no trash)

* **Loading states**:

  * No global spinners
  * Run button shows spinner when active
  * Upload button shows spinner during file parse
  * Cell shows animated skeleton (3 pulsing bars) while running

## Frontend State (Shape)

* `prompts`: `{ id, name, type: 'generator'|'grader', text, expected_output: 'none'|'response'|'json', version_counter, created_at, updated_at }`
  * Note: `expected_output` exists in data model but is **auto-detected from prompt content** (not a UI control)
* `models`: global registry: `[{ id, provider, model }]` (reusable across runs)
* `datasets`: `{ id, name, source: 'upload'|'manual', headers: string[], row_count, rows: Record<string,string>[] }` (stores first 50 rows for preview)
* `runs`: `{ id, prompt_id, version_label, dataset_id|null, model_ids[], grader_id|null, created_at }`
* `cells`: keyed by `(run_id, column_index, row_index)`:

  * `{ run_id, model_id, column_index, row_index, status: 'idle'|'running'|'ok'|'error'|'malformed', output_raw, output_parsed, tokens_in, tokens_out, cost, latency_ms, error_message, graded_value (0..1), grader_full_raw, grader_parsed, manual_grade (0..1 | null) }`
  * `column_index` allows duplicate models in different columns
  * `manual_grade` stores user's thumbs up/down choice (overrides `graded_value`)
* `ui`: `{ metricView: 'grade'|'tokens'|'cost'|'latency', activeRunId: string|null }`
  * `metricView` defaults to 'grade' on load (not persisted)
  * `activeRunId` enforces single active run at a time

> For UI-only iteration, mock a repository layer that reads/writes to `localStorage` (same shape). Files named `*.temp.ts` contain mock logic that will be replaced by backend in Phase 2.

---

# Backend (when you’re ready)

## Tech

* **Supabase** (Auth, Postgres, Storage, Realtime)
* **Vercel** serverless API routes for provider calls (or Supabase Edge Functions)
* Provider adapters for OpenAI, Anthropic (extensible)

## High-Level Architecture

1. **Frontend** calls your **Backend API**:

   * `POST /runs` to create run
   * `POST /execute` to enqueue tasks
   * `GET /runs/:id/stream` (or Realtime) to receive cell updates
2. **Worker/Queue**:

   * Kick off parallel calls per `(model × dataset row)` with **retry & backoff**
   * On completion, write results to `run_cells` rows and emit Realtime events
3. **Provider Adapter Layer**:

   * Unified function: `runPrompt({ provider, model, promptText, variables })`
   * Handles formatting, API keys, token extraction, error normalization
4. **Cost Calc**:

   * Token counts from API response; costs from **pricing table** (editable in UI)

## Database Schema (normalized)

Tables (representative columns only):

* `users`

  * `id`, `email`, …
* `api_keys`

  * `id`, `user_id`, `provider`, `key_encrypted`, `created_at`
  * RLS: `user_id = auth.uid()`
* `prompts`

  * `id`, `user_id`, `name`, `type` (`'generator'|'grader'`), `text`, `version_counter`, `created_at`, `updated_at`
* `datasets`

  * `id`, `user_id`, `name`, `headers` (string[]), `row_count`, `storage_path` (for CSV) OR `rows_json` (optional)
* `runs`

  * `id`, `user_id`, `prompt_id`, `version_label` (e.g., “Generator 6”), `dataset_id` (nullable), `grader_id` (nullable), `created_at`
* `run_models`

  * `id`, `run_id`, `provider`, `model`
* `run_cells`

  * `id`, `run_id`, `run_model_id`, `row_index` (0 for live input)
  * `status` (`'running'|'ok'|'error'|'malformed'`)
  * `output_raw`, `output_parsed`
  * `tokens_in`, `tokens_out`, `latency_ms`, `cost`
  * `error_message`
  * `grader_output_raw`, `grader_output_parsed`, `graded_value` (0..1)
  * Index: `(run_id, run_model_id, row_index)` unique
* `pricing`

  * `id`, `user_id`, `provider`, `model`, `price_per_input_token`, `price_per_output_token`
* `cache`

  * Key: hash of `(prompt_id, prompt_text_hash, model, input_hash)`
  * Values: `output_raw`, `output_parsed`, `tokens_in`, `tokens_out`, `latency_ms`, `cost`, `created_at`

> RLS everywhere on `user_id`. Use Supabase **Vault/Secrets** or strong encryption for API keys.

## API Endpoints (minimal)

* `POST /auth/session` (Supabase handles; FE uses Supabase SDK)
* `GET/POST /prompts`, `PATCH /prompts/:id`, `DELETE /prompts/:id`
* `GET/POST /datasets` (upload → Supabase Storage; parse headers client-side)
* `POST /runs`

  * Body: `{ prompt_id, dataset_id|null, grader_id|null, models: [{provider, model}], run_mode: 'live'|'dataset', live_input?: object }`
  * Creates run + run_models; returns `run_id`
* **Realtime**: subscribe to `run_cells` changes by `run_id`
* `POST /execute` (or run automatically on `POST /runs`)

  * Server enqueues `(row × model)` tasks
* `POST /cell/rerun`

  * Body: `{ run_id, run_model_id, row_index }` → bypass cache and overwrite

## Provider Adapters

* Unified signature:

  ```ts
  async function runPrompt({
    provider, model, apiKey, promptText, variables
  }): Promise<{
    output_raw: string,
    tokens_in: number, tokens_out: number,
    latency_ms: number
  }>
  ```
* Implement **OpenAI** (chat.completions), **Anthropic** (messages)
* Parse `<response>` if present; leave full text in `output_raw`
* Error normalization: include `provider_code`, raw message

## Execution & Concurrency

* **Async, parallel** up to a safe cap (e.g., 5–10 concurrent requests/model)
* **Retry with exponential backoff** (e.g., 0.5s, 1s, 2s, 4s; 3 tries) on 429/5xx
* On terminal failure → `status='error'`, set `error_message`

## Caching

* Before calling provider:

  * Compute key `(prompt_id + prompt_text_hash + model + input_hash)`
  * If **not a cell re-run** and cache hit → use cached result
* Store after success (OK or MALFORMED)

## Cost & Metrics

* **Tokens**: from provider responses when available
* **Latency**: server timestamps diff (don’t store raw timestamps if you prefer)
* **Cost**: `tokens_in*in_price + tokens_out*out_price` (from `pricing` table)

## Validation Rules

* Dataset run: all `{{vars}}` referenced by **generator** must exist in dataset headers
* If **grader** selected: all `{{vars}}` it references must exist across **headers + generator output placeholder**
* If expecting tags/JSON but parsing fails → `status='malformed'` (counts as fail in grade)

---

# Security

* **Auth**: Supabase Auth (OAuth or magic link)
* **API Keys per user**: encrypted at rest; never exposed to client; backend signs requests
* **RLS**: strict on all tables by `user_id`
* **Rate limits**: per user, per run (throttle concurrency to avoid bans)

---

# Testing Plan

## Frontend (Cypress + Vitest)

1. **Editor & Autosave**

   * CodeMirror editor with syntax highlighting (`{{variables}}`, `<tags>`, "json")
   * Blur, prompt switch, or pre-run persists content
   * Version number increments **only on run** (and only if text changed since last run)
   * Inline rename resets version to 1
2. **Run Validation**

   * Missing placeholders → blocked with modal error dialog
   * Dataset optional when prompt has no placeholders
   * Extra dataset columns → allowed
3. **Results Grid**

   * Columns add/remove/edit (max 4 models)
   * **Cell single-click expands** full output in modal
   * Metric cycling button switches metrics & summary row
   * Tokens show `in | out`
   * Model editing clears stale cells; removal shifts indices
4. **Grader Overlay**

   * Color badge shows (0.0=red, 1.0=green, gradient between)
   * Click badge → full grader output shown in cell; mouse leave → revert
5. **Manual Grading**

   * When no grader selected, thumbs up/down appears in grade view
   * Click to cycle: null → green (1.0) → red (0.0) → green
   * Manual grades override auto-grades in summary
6. **Re-run Cell**

   * Hover during active run shows re-run button
   * Bypasses cache; cell updates (not available for historical runs)
7. **View Modes**

   * Focus mode (65% left / 35% right) triggers on editor focus
   * Balanced mode (30% left / 70% right) triggers on editor blur or Run click
   * 300ms spring animation between modes
   * View mode persisted to localStorage
8. **First-Load Behavior**

   * Seeds data, deduplicates models, auto-selects first model
   * Grid not empty on first load
9. **Error Display**

   * Cell shows white background with red border
   * Error message displayed in cell; full details in expand modal

## Backend (Integration + Unit)

1. **Provider Adapters**

   * OpenAI/Anthropic happy path returns tokens & output
   * Error paths normalize messages; 429/5xx retries then fail
2. **Caching**

   * Identical `(prompt, model, input)` hits cache
   * Cell re-run bypasses cache
3. **Cost Calculation**

   * Pricing read & applied; totals match token counts
4. **Validation**

   * Dataset & grader var checks block run with clear error
5. **Realtime**

   * Inserting `run_cells` updates emits subscription events
6. **RLS**

   * Cross-user access denied on all resources

---

# Deliverables & Milestones

## Phase 1 — **Frontend-only (Mocked Data)** ✅ COMPLETE

* Single page app (`/` route only):

  * Two-panel layout with dynamic focus/balanced modes
  * Left: Prompt editor (CodeMirror with syntax highlighting, inline rename, version display)
  * Right: Results grid + toolbar (metric cycling, grader selector, dataset upload)

* Components implemented:

  * **EditorPanel** (`frontend/components/EditorPanel.tsx`): Prompt management, text editing, dataset preview display, run triggering
  * **PromptEditor** (`frontend/components/PromptEditor.tsx`): CodeMirror wrapper with custom styling and keybindings
  * **DatasetSelector** (`frontend/components/DatasetSelector.tsx`): Read-only dataset preview (name, row count, preview modal) — no selection UI; upload happens via toolbar
  * **ResultsGrid** (`frontend/components/ResultsGrid.tsx`): Table rendering, model management (embedded), cell states, metric badges, manual grading, re-run. **Editing a model clears stale cells for that column; removing a model shifts column indices for remaining cells.**
  * Modal, Button, Dropdown, Badge, Spinner UI primitives from shadcn/ui

* Features:

  * **First-load initialization**: Seeds data, deduplicates provider/model combos, auto-selects first model so grid isn't empty
  * Model management embedded in ResultsGrid (add/edit/remove columns, max 4 models)
    * Editing a model clears stale cells for that column to prevent showing outdated results
    * Removing a model shifts column indices for remaining cells
  * Manual grade toggle (thumbs up/down) when no grader selected
  * Grader overlay (click badge to show grader output in cell)
  * Per-cell re-run (hover overlay with reload icon)
  * Metric cycling with fade animations
  * Upload toast notifications
  * Focus/balanced view modes with auto-trigger
  * Dataset upload via toolbar button (CSV/JSON parsing)
  * Validation on run (modal error dialogs; dataset optional when no placeholders)

* Mock persistence (`frontend/lib/mockRepo.temp.ts`):

  * localStorage-based CRUD for Prompts, Datasets, Models, Runs, Cells
  * Seed data initialization
  * Version bump logic (only on run if text changed)
  * Rename resets counter to 1

* Mock execution (`frontend/lib/mockRunExecutor.temp.ts`):

  * Simulates async per-cell generation with random delays
  * Mock grading with random scores
  * Single active run enforcement
  * Per-cell re-run with cache bypass

* Keyboard shortcuts:

  * **Cmd/Ctrl+Enter** to Run
  * **Ctrl+Shift+Z** to toggle line wrapping in editor

## Phase 2 — **Backend Wiring**

* Supabase schema + RLS
* Auth flow (GitHub/Google)
* API keys CRUD (encrypted)
* Pricing CRUD
* Upload datasets → Supabase Storage; headers parsed client-side; persist metadata
* Runs + Realtime cell updates (simple worker loop)
* Provider adapters (OpenAI/Anthropic)

## Phase 3 — **Hardening**

* Retry/backoff logic
* Error normalization & tooltips
* Cache table + eviction policy (simple TTL if needed)
* Run History list & open past view

---

# Nice-to-Have (Post-v1)

* Duplicate prompt
* Filters/search (failed runs, input text search)
* Keyboard shortcuts for metric toggle
* Multi-grader support
* Export CSV/JSON
* Diff view between versions
* Multi-user roles



## What we're explicitly NOT doing in Phase 1

### Completely removed / deferred indefinitely:
- **No history management**: No UI to browse/restore previous run versions. Current run results stay visible until next run. Version arrows removed from UI.
- **No live input mode**: Only dataset runs supported (dataset required to run). No single-input form.
- **No pricing page**: Raw cost data collected but no `/pricing` route or pricing management UI (deferred).
- **No parsed/full output toggle**: Output display is fixed (raw output always shown). Backend will handle `<response>` and JSON parsing to populate `output_parsed` field for future use.
- **No expected output UI controls**: Detection is automatic from prompt content (presence of `<response>` tags or "json" keyword). No selector in editor panel.

### Not in Phase 1 (may add in Phase 2+):
- No projects/collections (single global list of prompts with a type tag)
- No multi-tab editing; one prompt visible at a time
- No export (CSV/JSON)
- No filters/search on results (failed only, text search, etc.)
- No duplicate prompt / duplicate run actions
- No multi-grader per run (one grader max; optional)
- No model parameter controls (temperature, max tokens, top-p, etc.)
- No environment selector (all in one env)
- No ownership/creator tracking beyond your user
- No trash/recovery — deletes are permanent
- No global loading bar; only button-level spinner
- No global theme switch (single light theme with your palette)
- No persisted timestamps (we store latency only)
- No tooltips/help text beyond error display in cells/modals
- No pricing auto-sync from providers
- No multiple keys per provider (one per provider per user)
- No multiple concurrent dataset runs (single active run enforced by `activeRunId`)
- No server-side JSON schema validation beyond "is valid JSON" (no schema matching)
- No Run state polling; we'll use Supabase Realtime when backend lands (Phase 1 uses 500ms polling)

---

## Implementation Notes

### Expected Output Detection (Backend Logic)
When backend is implemented, output validation should work as follows:
- If prompt text includes `<response>` tags → parse and extract response section; if missing or malformed → mark cell as `status='malformed'`
- If prompt text includes the word "json" (case-insensitive) → attempt JSON.parse on output; if fails → mark `status='malformed'`
- If both conditions met → validate `<response>` first, then validate JSON within response
- Malformed cells count as fail (0.0) in grade calculations
- `output_parsed` field stores the successfully parsed content; `output_raw` always stores full output

### Parsing Logic Location
- Frontend: `frontend/lib/utils.ts` contains `parseOutput()` function with basic logic (used for display)
- Backend (Phase 2): Will contain authoritative validation in worker/executor (determines `status='malformed'`)
- Files marked `*.temp.ts` contain mock logic to be replaced in Phase 2

### API Keys Management (Phase 2)
- Minimal API Keys page: per user, one key per provider (OpenAI, Anthropic, etc.)
- Saved encrypted in Supabase using Vault/Secrets
- Never exposed to client; backend signs all provider requests