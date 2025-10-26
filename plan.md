# Prompt Refinement Backend Blueprint (Ultrathink v1)

## Context Snapshot
- Frontend (Next.js App Router) is functionally complete, currently backed by in-browser mocks.
- Goal: introduce a Supabase-backed service layer that persists prompts/datasets/runs, executes mock + real provider calls, and feeds the existing UI via APIs with incremental, well-tested changes.
- Constraints: favour TypeScript end-to-end, keep async run pipeline, enable future realtime via Supabase, maintain ability to fall back to polling for v1.

## Guiding Principles
- Ship value in thin vertical slices: data model → services → API → UI wiring, with production-grade tests before integration.
- Prefer explicit domain modules (Prompt, Dataset, Run, ModelConfig, Grader, Execution) with clear ownership boundaries.
- Test-driven progression: each unit adds or expands tests (unit first, integration second).
- Keep environment + tooling deterministic (pnpm, Vitest, ESLint) and enforce schema via migrations stored in git.
- Ensure no orphaned logic: every backend capability is surfaced by an API and exercised by tests before moving on.

## Target Architecture (Phase 2/3)
- **Backend service** (`backend` package): Fastify + TypeScript, structured logging, Zod-based validation, Vitest test suite.
- **Data layer**: Supabase Postgres with Drizzle ORM migrations; Supabase Storage for dataset files.
- **Auth**: Supabase Auth (JWT) validated server-side; service role key for internal jobs.
- **Execution**: Queue (BullMQ + Redis, with clear adapter interface) running worker that calls provider adapters (OpenAI/Anthropic) or mock executor.
- **Realtime**: Supabase Realtime broadcasts (webhooks) with UI fallback to 500 ms polling.
- **Observability**: Pino logs, request tracing id, basic metrics hooks for later integration.

## Data Model Outline (initial tables)
- `prompt` — id, name, type (`generator`|`grader`), created_at, updated_at, owner_id.
- `prompt_version` — id, prompt_id, version_number (int), body, hash, created_at, run_id (nullable).
- `model_config` — id, provider, model, label, created_at, is_default.
- `dataset` — id, name, source_filename, storage_path, row_count, headers (jsonb), created_at, owner_id.
- `dataset_row` — id, dataset_id, row_index, values (jsonb), checksum.
- `run` — id, prompt_version_id, dataset_id (nullable), grader_prompt_version_id (nullable), status, started_at, completed_at, error, active_metric.
- `run_model` — id, run_id, model_config_id, display_order.
- `run_cell` — id, run_model_id, dataset_row_id, status, output_raw, output_parsed, grade, tokens_in, tokens_out, cost, latency_ms, error_code.
- `run_cell_event` — id, run_cell_id, event_type (`queued`|`started`|`succeeded`|`failed`|`grader_succeeded`), payload jsonb, created_at.
- `manual_grade` — id, run_cell_id, value (`pass`|`fail`|`unset`), created_at, user_id.
- `api_key` — id, provider, encrypted_key, created_at (Phase 3).
- All tables audited with triggers for Supabase Realtime broadcasts (Phase 3+).

## Roadmap & Granular Steps

### Phase A — Backend Foundation
#### Milestone A1 — Project Bootstrap
1. **Step A1.1 — Scaffold backend workspace**
   - Init `backend` package (pnpm) with TypeScript, tsconfig paths, nodemon dev command.
   - Add shared `@backend/config` module for env constants stub.
   - Testing: smoke Vitest test that asserts app bootstraps.
2. **Step A1.2 — Tooling & Quality Gates**
   - Configure ESLint + Prettier + TypeScript project references; add lint/test npm scripts.
   - Introduce Husky or simple `lint-staged` runner (optional) for future use.
   - Testing: add CI placeholder workflow (local script) verified by Vitest + lint run.
3. **Step A1.3 — Fastify server skeleton**
   - Instantiate Fastify instance with health endpoint (`GET /healthz`) and graceful shutdown hooks.
   - Wire logging via Pino; ensure JSON logs in tests.
   - Testing: Supertest integration verifying 200 response + structure.

#### Milestone A2 — Configuration & Infrastructure
4. **Step A2.1 — Environment loader**
   - Implement `loadEnv()` using `dotenv` + Zod to enforce required vars (Supabase URL, anon key, service key, Redis URL, etc.).
   - Provide `config.example.env`.
   - Testing: unit tests for missing vs valid env scenarios.
5. **Step A2.2 — Shared error envelope & result helpers**
   - Create error classes (`DomainError`, `ValidationError`, `NotFoundError`) and map to HTTP responses.
   - Establish standardized success/errored response DTO scaffolds.
   - Testing: unit tests for error mapping; integration tests hitting a dummy route.

#### Milestone A3 — Database Layer
6. **Step A3.1 — Introduce Drizzle + migrations**
   - Configure Drizzle with Supabase connection; add migration runner script (`pnpm db:migrate`).
   - Create baseline schema (prompt, prompt_version, model_config).
   - Testing: migration snapshot test + repository test ensuring insert/select works against test database (Docker or Supabase test instance).
7. **Step A3.2 — Dataset schema**
   - Extend schema with dataset + dataset_row; add storage path columns.
   - Testing: repository tests verifying dataset creation, row insertion, paging.
8. **Step A3.3 — Run schema & indexes**
   - Add run, run_model, run_cell, run_cell_event, manual_grade tables with necessary foreign keys & indexes.
   - Testing: referential integrity test + verifying cascade behaviour; ensure run_cell_event default ordering works.

### Phase B — Domain Services
#### Milestone B1 — Prompt & Dataset Management
9. **Step B1.1 — Prompt service with version bumping**
   - Implement prompt repository/service functions: create prompt, update body (new version), fetch latest, list.
   - Include automatic version bump only on run trigger flag.
   - Testing: unit tests verifying version increments, hash dedupe, rename resets version counter.
10. **Step B1.2 — Dataset ingestion pipeline**
    - Implement dataset upload handler: accept CSV/JSON metadata, store to Supabase Storage (stub adapter writing to local FS in dev), persist rows.
    - Add streaming parser (Papa Parse) with validation of headers vs placeholders.
    - Testing: integration test uploading fixture dataset, verifying rows stored, metadata computed.

#### Milestone B2 — Model & Grader Configuration
11. **Step B2.1 — Model config registry**
    - CRUD service for `model_config`; enforce max 4 active per run; include seeding script with default providers.
    - Testing: service tests ensuring duplicate prevention, seeding idempotency.

### Phase C — Run Execution Pipeline
#### Milestone C1 — Run lifecycle core
12. **Step C1.1 — Run creation & validation**
    - Service to create run: validate dataset presence for placeholders, ensure models selected, attach grader if provided.
    - Persist run + run_model rows, queue jobs (placeholder queue call).
    - Testing: unit tests covering validation failures, success path persists correct rows.
13. **Step C1.2 — Queue harness + worker bootstrap**
    - Integrate BullMQ with Redis; define queue + job payload types; worker skeleton processing run cells sequentially.
    - Start worker from separate entrypoint; handle graceful shutdown.
    - Testing: worker unit tests using ioredis-mock; ensure jobs transition statuses.
14. **Step C1.3 — Provider adapter interface + mock executor**
    - Define provider adapter contract (generateCompletion, computeCost, parseMetadata).
    - Implement mock adapter mirroring existing frontend behaviour; stub real OpenAI adapter with placeholder.
    - Testing: unit tests verifying adapter contracts; worker tests ensuring adapter invoked and results persisted.
15. **Step C1.4 — Grading & metric computation**
    - Implement expected output detection (response tags vs JSON) and scoring logic; integrate manual grade toggles.
    - Update run_cell records with grade/tokens/cost/latency.
    - Testing: unit tests on parser/validator; worker integration verifying grade outcomes.

#### Milestone C2 — Progress reporting
16. **Step C2.1 — Run state polling API**
    - Add endpoints to fetch run summary, run cells, and cell detail, optimized with pagination.
    - Include `updated_since` param for incremental polling from UI.
    - Testing: integration tests hitting endpoints after mock run to ensure diffing works.
17. **Step C2.2 — Supabase Realtime triggers (optional behind flag)**
    - Create database triggers to publish run/cell events; add backend subscriber to forward to UI when enabled.
    - Testing: end-to-end test (if possible) or manual instructions; unit test verifying subscription handler.

### Phase D — Frontend Integration & Auth
#### Milestone D1 — Secure API surface
18. **Step D1.1 — Supabase auth middleware**
    - Validate JWT from frontend requests; attach user context; support service role bypass for worker.
    - Testing: integration tests ensuring authenticated vs unauthenticated access behaviour.
19. **Step D1.2 — API endpoints for prompts & datasets**
    - REST routes: `/prompts`, `/prompts/:id`, `/datasets`, `/datasets/:id/preview`.
    - Swap frontend data fetching to these endpoints, keeping mocks as fallback for offline mode.
    - Testing: update frontend integration tests (Playwright or Vitest + MSW) to verify flows.
20. **Step D1.3 — Run execution endpoints**
    - `/runs` creation, `/runs/:id`, `/runs/:id/cells`, `/runs/:id/cells/:cellId`.
    - Wire UI actions (run button, re-run, manual grade toggle) to backend.
    - Testing: e2e tests ensuring run triggers worker and UI updates via polling.

#### Milestone D2 — Frontend wiring completion
21. **Step D2.1 — Remove mock repositories**
    - Replace `frontend/lib/mockRepo.temp.ts` & `mockRunExecutor.temp.ts` with API clients using `fetch`.
    - Ensure optimistic UI fallback while run pending; handle error toasts from backend responses.
    - Testing: React testing-library coverage for store hooks; integration tests verifying dataset upload + run flow.
22. **Step D2.2 — Feature gates & configuration**
    - Add feature flag for realtime vs polling; configuration page for API keys (stub UI).
    - Testing: unit tests verifying feature toggle values; manual QA checklist.

### Phase E — Hardening & Ops
23. **Step E1 — Observability & metrics**
    - Add request/worker tracing id, log scrubbing, basic prometheus metrics (HTTP latency, queue depth).
    - Testing: unit tests ensuring middleware attaches ids; snapshot logs.
24. **Step E2 — CI/CD pipeline**
    - GitHub Actions (or similar) running lint, tests, migrations; preview Supabase migrations; optional deploy script.
    - Testing: ensure pipeline passes locally; document manual release steps.
25. **Step E3 — Documentation & onboarding**
    - Update `README.md` with backend instructions, env setup, dev scripts, testing strategy, troubleshooting.
    - Testing: not applicable; rely on review + manual run-through.

## Prompt Suite (TDD-first Execution)

### Prompt 1 — Backend workspace bootstrap
```text
Implement Step A1.1. Scaffold a new TypeScript Fastify backend under `backend/`. Use pnpm, create tsconfig with path aliases, add `src/server.ts` that currently just exports a Fastify instance factory, and configure Vitest. Write a basic Vitest spec ensuring the server factory returns a Fastify instance with no routes yet. Do not add Fastify startup code; just the scaffold.
```

### Prompt 2 — Tooling + quality gates
```text
Implement Step A1.2. Add ESLint (typescript-eslint) and Prettier configs, hook them into package scripts, and configure Vitest to run with coverage thresholds. Ensure `pnpm lint` and `pnpm test` run cleanly. Add a sample lint rule test (e.g., intentional unused var) in tests to confirm lint fails without fix. Update `package.json` scripts only within backend.
```

### Prompt 3 — Fastify health endpoint
```text
Implement Step A1.3. Extend the server factory to register logging (pino) and a `/healthz` route returning `{ status: 'ok' }`. Add integration tests using Supertest to confirm 200 status and JSON payload. Include graceful shutdown hooks but keep the entrypoint lightweight.
```

### Prompt 4 — Environment loader
```text
Implement Step A2.1. Create a `config/env.ts` module that loads `.env` (using dotenv) and validates via Zod (Supabase URL, anon key, service key, Redis URL, NODE_ENV). Provide `config/example.env`. Write unit tests covering missing variables, invalid URLs, and success cases. Ensure tests mock process.env cleanly.
```

### Prompt 5 — Error handling utilities
```text
Implement Step A2.2. Add domain-specific error classes and a Fastify plugin that maps them to HTTP responses. Create a dummy route under `/debug/error` to trigger each error for tests. Write Vitest integration tests asserting HTTP status codes and bodies for each error type.
```

### Prompt 6 — Drizzle bootstrap & base schema
```text
Implement Step A3.1. Add Drizzle ORM with Postgres driver, configure migration scripts, and define tables for `prompt`, `prompt_version`, and `model_config`. Provide an integration test using a test database (you may use pg-mem or Docker) that migrates and verifies basic CRUD via repository helpers.
```

### Prompt 7 — Dataset schema + persistence
```text
Implement Step A3.2. Extend Drizzle schema with `dataset` and `dataset_row`. Add repository functions to create datasets and bulk insert rows in a transaction. Write tests ingesting a small CSV fixture to ensure headers and row_count are stored correctly.
```

### Prompt 8 — Run schema completion
```text
Implement Step A3.3. Add tables for `run`, `run_model`, `run_cell`, `run_cell_event`, and `manual_grade` with necessary indexes and relations. Update migrations accordingly. Provide tests that insert a run with models and cells, verifying cascading deletes and event ordering.
```

### Prompt 9 — Prompt service with versioning
```text
Implement Step B1.1. Build a prompt service that can create prompts, update text while managing versions, and fetch latest versions. Hash prompt bodies to avoid duplicate versions. Write unit tests covering creation, updates with/without text changes, and rename resetting version numbers.
```

### Prompt 10 — Dataset ingestion pipeline
```text
Implement Step B1.2. Add a dataset ingestion service that accepts CSV/JSON streams, uploads raw files via a storage adapter (local filesystem stub now), parses headers, and stores rows using the repositories. Ensure placeholders are detected and stored. Write integration tests feeding sample CSV and JSON fixtures, asserting metadata and storage calls.
```

### Prompt 11 — Model config registry
```text
Implement Step B2.1. Provide CRUD operations for `model_config`, enforce unique provider/model combos, and add a seeding script with default models. Write tests to verify seeding idempotency and validation errors when exceeding max active models.
```

### Prompt 12 — Run creation & validation
```text
Implement Step C1.1. Create a run service that validates prompt/dataset compatibility, ensures selected models exist, optionally links a grader, and persists run + run_model records. Stub queue enqueue logic. Tests should cover validation errors (missing dataset with placeholders, no models) and success path verifying database state.
```

### Prompt 13 — Queue harness & worker skeleton
```text
Implement Step C1.2. Integrate BullMQ (or a lightweight queue if easier) to enqueue cell jobs. Provide worker entrypoint processing jobs sequentially and updating run_cell status transitions (`queued` → `running` → `completed`). Use ioredis-mock in tests to assert job lifecycle.
```

### Prompt 14 — Provider adapters & mock executor
```text
Implement Step C1.3. Define an adapter interface for model providers. Implement a mock adapter that generates deterministic outputs matching frontend expectations, and wire it into the worker. Add tests ensuring adapter methods receive correct payloads and results persist to `run_cell`.
```

### Prompt 15 — Grading & metrics
```text
Implement Step C1.4. Add grading utilities that detect `<response>` tags and `json` references, compute grades, and update tokens/cost/latency metrics. Extend worker to call grading after provider response. Tests should cover parser edge cases and ensure run_cell records reflect grades and metrics.
```

### Prompt 16 — Run polling APIs
```text
Implement Step C2.1. Expose REST endpoints for run summary and paginated cells with `updated_since` filtering. Tests should create a run via factories, simulate worker updates, and ensure API responses only include changed cells when the timestamp filter is provided.
```

### Prompt 17 — Supabase Realtime option
```text
Implement Step C2.2. Behind a feature flag, add Supabase Realtime subscriptions for run_cell events and expose a WebSocket bridge (or SSE) to the frontend. Write unit tests for the subscription handler; document manual QA steps to verify realtime behaviour.
```

### Prompt 18 — Auth middleware
```text
Implement Step D1.1. Validate Supabase JWTs on incoming requests, attach user info to Fastify request, and enforce auth on protected routes. Allow service-role bypass for worker tasks using a secret header. Tests should cover authenticated, unauthenticated, and service-role scenarios.
```

### Prompt 19 — Prompt & dataset APIs + frontend wiring (part 1)
```text
Implement Step D1.2. Add REST routes for prompts and datasets, including dataset preview. Create a frontend API client module replacing mock repo reads for prompts/datasets. Update frontend tests (Vitest/React Testing Library) to stub API responses and ensure views render real data.
```

### Prompt 20 — Run execution APIs + frontend wiring (part 2)
```text
Implement Step D1.3. Add run creation, cell polling, and manual grade endpoints. Replace frontend mock executor with API-backed run flow, ensuring run button triggers backend execution and polling updates the grid. Add tests verifying per-cell re-run and grade toggles propagate correctly.
```

### Prompt 21 — Feature flags & cleanup
```text
Implement Step D2.1/D2.2. Add configuration surface for realtime vs polling and stub API key management UI. Remove remaining mock files. Ensure frontend gracefully handles backend errors with toasts. Update documentation and add regression tests for dataset upload + run happy path.
```

### Prompt 22 — Observability & CI
```text
Implement Steps E1–E3. Add request tracing, log formatting, and basic Prometheus metrics. Configure CI workflow running lint/test/migrations. Update README with backend setup instructions and troubleshooting. Verify pipeline scripts locally.
```

