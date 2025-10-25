# Spec: Prompt Refinement UI (v1)

Goal: ship a **front-first** MVP you can iterate on, with a clean path to a Supabase/Server backend.
Scope: single-user UI that edits/runs **prompts** (generators) and **graders**, compares **models** side-by-side, runs **datasets** asynchronously, and shows **stats** (grade, tokens, cost, latency).

---

# Frontend (Next.js + React + Tailwind + shadcn/ui)

## Tech

* Framework: **Next.js (App Router)**, **React 18**
* Styling: **Tailwind**, custom palette (background `#FAFAFA`, accents `#8685ef`, `#faf8ff`, `#dedbee`)
* Components: **shadcn/ui** (Button, Dialog/Sheet, Dropdown, Input, Table, Badge, Tooltip)
* Markdown: `react-markdown` (render), simple `<textarea>` (edit)
* Keyboard: `CMD + Enter` triggers **Run**
* Theme: single light theme (creamy background)
* Realtime (later): Supabase Realtime; for v1 UI-first, mock/local store

## Core Concepts

* **Prompt**: either `generator` or `grader` (type tag). Automatic version bump **on run** only.
* **Run**: execution of a single **prompt** against **one or more models**.

  * **Live run** (single input via form) and **dataset run** (per row input substitution).
  * **Async** execution; results stream into each model **column** as ready.
* **Dataset**: CSV/JSON with headers; used to fill `{{placeholders}}` in prompts/graders.

## UX Layout (Two-Panel)

**Left Panel (Editor/Setup)**

* Prompt header: name (editable), type (generator/grader), version label (e.g., “Generator 6”)
* Markdown editor (multi-line). Autosave **on blur**.
* Variables section:

  * Detected placeholders (from prompt text), read-only chips
  * Dataset selector (name shown; **click → preview modal** up to first 50 rows)
  * Grader selector (optional; when set, grader auto-runs)
* Model selector:

  * Start with one model column; **“+ Add model”** button adds more columns (provider+model)
* Run controls:

  * Button “Run” (shadcn Button+Spinner while firing), **CMD+Enter**
  * Validation on click:

    * If dataset run: verify generator/grader placeholders exist in dataset headers
    * If invalid → block with toast/banner message (no run)

**Right Panel (Results Grid)**

* Columns: one per **model** (provider+model)
* Rows: inputs (live input = row 1; dataset = one row per record)
* **Cell content**:

  * Truncated **generator output** (double-click → expand full)
  * **Overlay badges** (appear on hover):

    * Top-right **Re-run** icon → bypass cache for this cell
    * Bottom-right **Metric badge** (depends on current view: Grade/Tokens/Cost/Latency)
    * **Grader badge** overlay (colored): click → flip to show grader’s full response; click elsewhere → revert
  * Auto-parse `<response>` section if present; UI toggle (top toolbar) for **Full Output** vs **Parsed Response**
  * If tags/JSON malformed when expected → mark **Malformed** (counts as fail for binary grade)
* **View toggle** (top-right of table):

  * **Grade / Tokens / Cost / Latency**
  * Cells + **summary row** update to show that metric
  * Tokens show `input | output` (e.g., `12k | 0.5k`)
* **Summary row**:

  * Averages **per model column** for the selected metric
* **Errors**:

  * Cell shows **error icon** with tooltip containing **raw provider error** (red text in tooltip)

## Interactions & Rules

* **Automatic versioning**: On clicking Run, current prompt version increments (e.g., “Generator 5” → “Generator 6”). Edits before running do **not** increment.
* **Grader**:

  * Optional. If selected, auto-runs after each generator run.
  * Same protocol as generator: supports `<thinking>` and `<response>`, same parsing/toggle.
* **Caching**:

  * Default: cache by `(prompt_id, model_id, input_hash)`.
  * Cell **Re-run** bypasses cache and overwrites result.
* **Validation** (at run-time only):

  * **Generator**: all placeholders must exist in dataset headers (if dataset run).
  * **Grader** (if selected): placeholders must exist across **(dataset headers + generator output placeholder)**.
  * Extra dataset columns are ignored (no penalty).
* **Stats/Colors**:

  * Metric view toggle changes per-cell badge and summary row.
  * Grade color scale (unified): **No=red**, **Yes=green**, numerics map to 0..1 gradient (1–2 red, 3 yellow, 4–5 green). Yes→1.0, No→0.0.
* **History (per prompt)**:

  * A “History” tab shows previous runs (ID as `<prompt_name> - <counter>`). Click to reopen a past run’s results view.
* **Renaming**:

  * You can rename prompts; **run/version counters reset to 1**.
* **Deletion**:

  * Permanent (no trash).
* **Loading**:

  * No global spinners. Only use **shadcn Button + Spinner** for action buttons (e.g., Run, Submit).

## Frontend State (Shape)

* `prompts`: `{ id, name, type: 'generator'|'grader', text, version_counter, created_at, updated_at }`
* `models`: local registry of selected columns: `[{ id, provider, model }]`
* `datasets`: `{ id, name, source: 'upload'|'manual', headers: string[], rowCount }` + preview rows (lazy)
* `runs`: `{ id, prompt_id, version_label, dataset_id|null, model_ids[], grader_id|null, started_at }`
* `cells`: keyed by `(run_id, model_id, row_index)`:

  * `{ status: 'idle'|'running'|'ok'|'error'|'malformed', output_raw, output_parsed, tokens_in, tokens_out, cost, latency_ms, error_message, graded_value (0..1), grader_full_raw, grader_parsed }`
* `ui`: `{ metricView: 'grade'|'tokens'|'cost'|'latency', showParsedOnly: boolean }`

> For UI-only iteration, mock a repository layer that reads/writes to `localStorage` (same shape). Swap with API later.

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

   * Typing + blur persists content
   * Version number increments **only on run**
2. **Run Validation**

   * Missing placeholders → blocked with message
   * Extra dataset columns → allowed
3. **Results Grid**

   * Columns add/remove
   * Cell double-click expands
   * View toggle switches metrics & summary row
   * Tokens show `in | out`
4. **Grader Overlay**

   * Color badge shows (Yes/No/score mapping)
   * Click → full grader output; click away → revert
5. **Re-run Cell**

   * Bypasses cache; cell updates
6. **History**

   * Run appears with `<name> - <counter>`
   * Open past run restores table view
7. **Error Display**

   * Raw provider error shown in tooltip (red)

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

## Phase 1 — **Frontend-only (Mocked Data)**

* Pages:

  * `/` → opens **last used prompt editor**
  * `/pricing` → editable model pricing table (mock persistence)
  * `/history/:promptId` → run list (mock)
* Components:

  * Prompt editor (markdown, on-blur)
  * Model columns manager (+ add column button)
  * Dataset selector (name + preview modal)
  * Results grid (cells, overlays, metric toggle, summary row)
* Local mock repo (localStorage) with the state shapes above
* Keyboard shortcut **CMD+Enter** to Run
* Validation on run (mock headers & placeholders)

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



## Clarifications

# Output Expectation (per prompt/grader)

- Left panel metadata: Expected Output = None | <response> tags | JSON.
- If set to <response> → we parse that section; if missing → mark Malformed (counts as fail in binary).
- If set to JSON → attempt JSON.parse; on failure → Malformed.
- Toggle still lets you view Full vs Parsed.

# API Keys UI
- Minimal API Keys page: per user, one key per provider (OpenAI, Anthropic, …). Saved encrypted in Supabase.


## What we’re explicitly NOT doing in v1
- No projects/collections (single global list of prompts with a type tag).
- No multi-tab editing; one prompt visible at a time.
- No export (CSV/JSON).
- No filters/search on results (failed only, text search, etc.).
- No duplicate prompt / duplicate run actions.
- No multi-grader per run (one grader max; optional).
- No model parameter controls (temperature, max tokens, top-p, etc.).
- No environment selector (all in one env).
- No ownership/creator tracking beyond your user.
- No trash/recovery — deletes are permanent.
- No global loading bar; only button-level spinner.
- No global theme switch (single light theme with your palette).
- No persisted timestamps (we store latency only).
- No tooltips/help text beyond error tooltips on cells.
- No pricing auto-sync from providers (editable table only).
- No multiple keys per provider (one per provider per user).
- No multiple concurrent dataset runs (single active run).
- No server-side JSON schema validation beyond “is valid JSON” (no schema matching).
- No Run state polling; we’ll use Realtime when backend lands (UI v1 can mock).



#### If the prompt includes <response> tags, those should be a validation. If the prompt includes the word JSON, it should be validated against JSON. If both first response, then JSON.