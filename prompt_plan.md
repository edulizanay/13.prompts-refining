# Prompt Refinement Backend Blueprint (Supabase Stack)

## Context & Alignment
- Frontend (Next.js App Router) is feature-complete using mock repositories.
- Per `.agent/README.md`, Phase 2 relies on Supabase (Postgres, Auth, Storage); we will not introduce a parallel Fastify/Drizzle stack.
- Custom business logic will live in Next.js Route Handlers; Supabase Postgres is the single source of truth.
- Goal: replace mocks with production-ready Supabase-backed flows using simplest possible implementation.

## Guiding Principles
- **YAGNI first**: Build only what's needed now. Add pagination, concurrency, cleanup, rate limiting WHEN measured need appears.
- **True vertical slices**: every slice delivers schema + access + UI wiring + automated tests.
- **Explicit TDD**: write failing test → confirm failure → minimal code → confirm pass. Test behavior, not infrastructure absence.
- **Simplest implementation**: Start with basic CRUD. Add optimizations when profiling shows need.
- **Remove mocks promptly**: once a slice replaces a mock path, delete the mock code.
- **Add observability after features**: Build working features first, add logging/monitoring when you have something to observe.

## Development Environment
- **Tooling**: pnpm, Node 20 LTS, TypeScript (strict), Vitest (unit/integration), Playwright (E2E).
- **Supabase**: CLI for local dev (`supabase start`); production uses hosted Supabase.
- **Configuration**: `.env.local` with Supabase URL/keys, Groq/Cerebras API keys.
- **API surface**: Next.js Route Handlers in `frontend/app/api/*` (server-only).
- **LLM providers**: Groq (fast inference), Cerebras (backup/alternative).

## Implementation Philosophy
Start simple, add complexity when measured need appears:
- **Error handling**: Basic try/catch + error responses initially. Add structured errors when patterns emerge.
- **Pagination**: Start with "load all" queries. Add pagination when queries slow down (measure first).
- **File validation**: Add limits when users hit problems, not before.
- **Indexes**: Add primary keys initially. Add composite indexes when queries slow down.
- **Cleanup**: Handle immediate failures with transactions. Add scheduled cleanup if orphaned data accumulates.
- **Rate limiting**: Monitor usage first. Add limits if abuse occurs.

## Data Model (Minimal)
| Slice | Tables / Columns |
|-------|------------------|
| Slice 1 | `prompt` (id, name, type, body, created_at, updated_at, owner_id) |
| Slice 2 | `dataset` (id, name, file_path, row_count, created_at, owner_id)<br>`dataset_row` (id, dataset_id FK, row_index, data_json) |
| Slice 3 | `run` (id, prompt_id FK, dataset_id FK nullable, status, created_at, owner_id)<br>`run_model` (id, run_id FK, provider, model, display_label)<br>`run_cell` (id, run_model_id FK, dataset_row_id FK nullable, output_text, error_text, latency_ms) |
| Slice 4 | Add to `run_cell`: grade_score, grade_reason, tokens_in, tokens_out, cost_usd |

## Roadmap — Vertical Slices

### Slice 1 — Prompts (Basic CRUD)
**Goal**: Replace prompt mocks with real Supabase storage.

**1.1 Supabase project setup**
- Initialize Supabase CLI (`supabase init`)
- Create `prompt` table migration with RLS policies (`owner_id = auth.uid()`)
- Verify: `supabase db reset` succeeds locally

**1.2 Prompt data layer**
- Create `frontend/lib/supabase/client.ts` (browser client)
- Create `frontend/lib/supabase/server.ts` (server client with auth)
- Create `frontend/lib/data/prompts.ts` with: `listPrompts()`, `getPrompt(id)`, `createPrompt(data)`, `updatePrompt(id, data)`, `deletePrompt(id)`
- Tests: Integration tests against local Supabase verifying CRUD + RLS

**1.3 Replace prompt mocks**
- Update prompt list/detail pages to use new data layer
- Delete `frontend/lib/mockRepo.temp.ts` prompt-related code
- Tests: Playwright E2E "create prompt → reload → verify persists"

**Deliverables**:
- Working Supabase local environment
- Prompts stored in Postgres (no more mocks)
- E2E tests passing

---

### Slice 2 — Datasets (Upload & Preview)
**Goal**: Replace dataset mocks with Supabase Storage + Postgres.

**2.1 Dataset schema**
- Create `dataset` and `dataset_row` tables migration
- Add RLS policies for both tables
- Tests: Integration test inserting dataset + rows

**2.2 Dataset upload**
- Create `POST /api/datasets` Route Handler accepting CSV/JSON files
- Parse files, store in Supabase Storage, insert rows into `dataset_row`
- Use Postgres transactions for atomicity
- Tests: Integration test uploading fixture file → verify storage + DB rows

**2.3 Dataset preview**
- Create `GET /api/datasets/:id` returning dataset metadata + first 100 rows
- Tests: Integration test verifying data structure

**2.4 Replace dataset mocks**
- Update dataset upload/preview UI to use new APIs
- Delete mock dataset executor code
- Tests: Playwright E2E "upload CSV → preview data → verify rows render"

**Deliverables**:
- Datasets stored in Supabase Storage
- Dataset rows queryable from Postgres
- Dataset upload/preview working end-to-end

---

### Slice 3 — Runs (Synchronous Execution)
**Goal**: Replace run execution mocks with real LLM calls stored in Supabase.

**3.1 Run schema**
- Create `run`, `run_model`, `run_cell` tables migration
- Add foreign keys + cascade deletes
- Add RLS policies
- Tests: Integration test creating run → models → cells

**3.2 Run execution service**
- Create `frontend/lib/services/executor.ts` calling Groq/Cerebras APIs
- Implement synchronous execution (wait for all cells to complete)
- Handle dataset iteration (one cell per row)
- Store results in `run_cell` table
- Tests: Unit tests for executor logic with mocked fetch

**3.3 Run API**
- Create `POST /api/runs` Route Handler
- Validate prompt has dataset if placeholders exist
- Execute run synchronously, return run ID
- Create `GET /api/runs/:id` returning run status + cells
- Tests: Integration test creating run → verify cells populated

**3.4 Replace run execution mocks**
- Update "Run" button to call new API
- Update results table to fetch from Supabase
- Delete `frontend/lib/mockRunExecutor.temp.ts`
- Tests: Playwright E2E "run prompt with dataset → see outputs appear"

**Deliverables**:
- Real LLM calls (Groq/Cerebras)
- Run results stored in Postgres
- Full run workflow working end-to-end

---

### Slice 4 — Grading & Metrics
**Goal**: Add grading support and display cost/token metrics.

**4.1 Grading schema**
- Add grading columns to `run_cell`: `grade_score`, `grade_reason`, `tokens_in`, `tokens_out`, `cost_usd`
- Tests: Migration test verifying new columns exist

**4.2 Grading utilities**
- Create `frontend/lib/services/grader.ts` parsing `<response>` tags or JSON
- Extract grade from grader prompt outputs
- Tests: Unit tests covering parsing edge cases

**4.3 Grading integration**
- Update executor to call grader prompts (if specified)
- Store grade results in `run_cell`
- Calculate and store token counts + estimated costs
- Tests: Integration test running graded prompt → verify grade persisted

**4.4 Metrics UI**
- Display grade badges in results table (existing UI components)
- Show token counts and costs
- Add manual grade override toggle
- Tests: Playwright E2E verifying grades display correctly

**Deliverables**:
- Automatic grading working
- Manual grade overrides supported
- Cost/token metrics visible in UI

---

### Slice 5 — Production Readiness (Add as Needed)
**Deferred until measured need**:
- Pagination (when queries slow down)
- Cleanup jobs (when orphaned files accumulate)
- Rate limiting (when abuse occurs)
- Structured logging (when debugging gets hard)
- Async execution (when synchronous blocks UX)

Each item requires:
1. Measurement showing the problem
2. Failing test demonstrating the issue
3. Minimal implementation to fix
4. Verification the problem is solved

---

## What Gets Built (Summary)

After completing Slices 1-4, you will have:

1. **Supabase backend fully integrated**
   - Postgres database with prompts, datasets, runs tables
   - Supabase Storage for uploaded dataset files
   - Row-level security enforcing data isolation

2. **All mocks replaced with real implementations**
   - Prompts CRUD using Supabase client
   - Dataset upload/preview using Storage + Postgres
   - Run execution using real LLM APIs (Groq/Cerebras)

3. **Complete data persistence**
   - All prompts, datasets, runs stored in Supabase
   - Data survives page refreshes and browser restarts
   - Multi-user support via RLS

4. **Working LLM integration**
   - Real API calls to Groq and Cerebras
   - Support for multiple models per run
   - Dataset iteration (batch testing)

5. **Grading system**
   - Automatic grading via grader prompts
   - Manual grade overrides
   - Token counting and cost estimation

6. **Test coverage**
   - Unit tests for business logic
   - Integration tests for API routes + database
   - E2E tests for critical user flows

7. **Simple, maintainable codebase**
   - No premature optimization
   - Clear separation: Next.js UI → Route Handlers → Supabase
   - Easy to add pagination, rate limiting, etc. when needed
