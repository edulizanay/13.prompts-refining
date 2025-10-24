# `.agent/README.md` — Prompt Refinement UI (UI-first, Phase 1)

> **Phase 1 hard guard:** UI-only with mocks/localStorage. **Do not** add network calls, Supabase, auth, or provider SDKs. Validate the UX end-to-end first.

---

## What this repo is

A two-panel app to edit/version **prompts** (generators/graders), select **models** as columns, attach a **dataset**, **run**, and inspect results in a grid with metric views (**Grade / Tokens / Cost / Latency**). Optional grader auto-evaluates each output. Per-cell **re-run** bypasses cache. **One active run** at a time.

---

## Repo structure

```
.
├─ frontend/                          # Next.js app (Phase 1 lives here)
│  ├─ app/
│  │  ├─ layout.tsx                   # App shell: Tailwind, shadcn providers
│  │  └─ page.tsx                     # Main screen: wires panels & state (+ Cmd+Enter)
│  ├─ components/
│  │  ├─ EditorPanel.tsx              # Name/type/version, markdown editor, chips, dataset & grader selectors, Expected Output, Run
│  │  ├─ DatasetSelector.tsx          # Dropdown + upload CSV/JSON + preview modal
│  │  ├─ ModelManager.tsx             # Provider/model add/remove; renders column headers
│  │  └─ ResultsGrid.tsx              # Grid; owns ResultCell internally; expand, overlays, grader flip, summary row
│  ├─ lib/
│  │  ├─ types.ts                     # Authoritative TS types (Prompt, Dataset, Run, Cell, Model, enums)
│  │  ├─ utils.ts                     # Business utils: placeholders, <response> parsing, formatting, grade→color, validateRun
│  │  ├─ mockRepo.temp.ts             # ⟵ TEMP: localStorage CRUD (Prompts/Datasets/Runs/Cells), seed, counters
│  │  └─ mockRunExecutor.temp.ts      # ⟵ TEMP: async mock generation + grading, single-run guard, re-run bypass
│  └─ styles/                         # Tailwind config tokens, globals
│
├─ backend/                           # Placeholder (Phase 2+). Keep empty now.
│  └─ README.md                       # Notes for future: Supabase schema, adapters, worker/queue, realtime
│
└─ .agent/
   └─ README.md                       # This file (context + structure + where logic lies)
```

If you plan to deviate from this design, ask explicit permission to Edu

> **Keyboard shortcut:** Bind **Cmd+Enter** directly in `frontend/app/page.tsx` (keep it compact).

---

## Where logic lives (ownership)

* **Page orchestration —** `frontend/app/page.tsx`
  Holds selected prompt, models, metric view, run status. Calls repo/executor. Minimal business logic (wiring only).

* **UI components —** `frontend/components/*`

  * `EditorPanel.tsx`: name/type/version, **Expected Output** selector (`none | response | json`), markdown editor (autosave on blur), placeholder chips, dataset & grader selectors, **Run** (+ Cmd+Enter).
  * `DatasetSelector.tsx`: upload & parse CSV/JSON, list, preview modal (first 50 rows).
  * `ModelManager.tsx`: add/remove provider+model columns.
  * `ResultsGrid.tsx`: renders table; **internal** `ResultCell` handles truncate/expand, hover overlays, grader flip, summary row.

* **Business utilities —** `frontend/lib/utils.ts`

  * `extractPlaceholders(text)`
  * `parseResponseTags(text)` + safe JSON parse (for Expected Output mode)
  * `validateRun(generatorVars, graderVars, datasetHeaders)` (runtime block if missing)
  * Formatters: tokens as `input | output` (e.g., `12k | 0.5k`), cost, latency
  * Grade normalization (Yes→1.0, No→0.0, 1–5 → 0..1) + color mapping

* **TEMP persistence —** `frontend/lib/mockRepo.temp.ts`
  localStorage CRUD for Prompts, Datasets, Runs, Cells; version bump **on Run**; **rename resets counters to 1**.

* **TEMP execution —** `frontend/lib/mockRunExecutor.temp.ts`
  Simulates per-cell async generation + optional grader; random delay/metrics/errors; marks **Malformed** when Expected Output is `<response>` or JSON and parse fails; enforces **single active run**; per-cell **re-run** bypasses cache and overwrites.

* **Types —** `frontend/lib/types.ts`
  **Authoritative** contracts for all data shapes. Don’t invent shapes elsewhere.

---

## UI rules (baked in)

* Single global list of prompts with `type: 'generator' | 'grader'`.
* **Expected Output** per prompt/grader: `none | response | json`. If set and parse fails ⇒ **Malformed** (red) and fail in binary grade.
* **Versioning:** bump only on **Run**; edits don’t bump. **Rename resets to 1**.
* **Validation at run time**; block if placeholders missing (dataset may have extra columns—allowed).
* **Default view:** **Grade** on load (not persisted).
* **Tokens view:** show `input | output`.
* **Grader overlay:** colored badge; click to reveal full grader output; click away to return.
* **Per-cell re-run:** hover top-right; bypass cache, overwrite result.
* **One active dataset run**; disable Run while executing.
* **History (optional):** read-only; no re-run.

---

## TEMP → Backend migration plan (what gets replaced)

| Phase 1 TEMP file             | Phase 2 replacement (Backend)                      |
| ----------------------------- | -------------------------------------------------- |
| `lib/mockRepo.temp.ts`        | Supabase repos (Prompts/Datasets/Runs/Cells) + RLS |
| `lib/mockRunExecutor.temp.ts` | Queue/Worker + Provider Adapters + Realtime        |
| localStorage ids/counters     | DB sequences                                       |
| Random cost/tokens/latency    | Real API tokens + pricing table                    |

**Naming convention:** keep `.temp.ts` on any file slated for removal.
**Backend folder:** present now, implemented later (Supabase schema, adapters, worker/queue, realtime).

**Migration checklist:**

* [ ] Replace `mockRepo.temp.ts` with DB repos (RLS on `user_id`)
* [ ] Replace `mockRunExecutor.temp.ts` with job queue + adapters + realtime events
* [ ] Remove localStorage seeds/ids; switch to DB sequences
* [ ] Wire pricing table and real token counts

---

## Out of scope (Phase 1)

Auth, API keys, provider calls, Supabase, exports, filters/search, projects/collections, multiple concurrent runs, persisted timestamps, pricing UI, multi-grader, theme switching.

---

## Style & dependencies

* **Next.js (App Router) + React + TypeScript**
* **Tailwind + shadcn/ui**
* Palette: `#FAFAFA` (bg), accents `#8685ef`, `#faf8ff`, `#dedbee`.

---

## Phase 1 completion checklist

* Prompts editable; version bumps on **Run**; rename resets to **1**
* Dataset upload + preview; **runtime** var validation blocks invalid runs
* Add/remove model columns; results stream into cells
* Metric toggle works (Grade default); Tokens show **`input | output`**; summary row present
* Grader overlay (badge → full grader output) works
* Per-cell re-run bypasses cache; **only one active run** at a time

---

**TL;DR**
Frontend lives in `frontend/` and owns UX with mocks. Anything named `*.temp.ts` is **temporary** and will be removed once `backend/` is implemented in Phase 2. Keep files minimal; split later only if the file grows unwieldy.
