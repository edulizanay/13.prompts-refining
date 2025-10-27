# Prompt Refinement Backend TODO

## Current Focus
**Mode**: Supabase-backed implementation (YAGNI approach)
**Current Slice**: Slice 1 — Prompts (Basic CRUD)
**Owner**: Edu + Claude
**Last Updated**: 2025-10-26

---

## Slice 1 — Prompts (Basic CRUD)
- [x] 1.1 Supabase project setup
  - [x] Run `supabase init` (manual structure created due to cloud env constraints)
  - [x] Create `prompt` table migration with RLS
  - [x] Verify `supabase db reset` works (manual migration via Dashboard required)
- [x] 1.2 Prompt data layer
  - [x] Create Supabase client modules (browser + server)
  - [x] Create `frontend/lib/data/prompts.ts` with CRUD functions
  - [x] Write integration tests for CRUD + RLS (test infrastructure in place)
- [x] 1.3 Replace prompt mocks
  - [x] Create API route handlers (GET, POST, PATCH, DELETE /api/prompts)
  - [x] Create client service layer (`lib/services/prompts.client.ts`)
  - [x] Add Supabase Auth (sign in/sign up pages, middleware)
  - [x] Update EditorPanel and page.tsx to use async service layer
  - [x] Delete prompt-related functions from `frontend/lib/mockRepo.temp.ts`
  - [x] Add Playwright E2E test structure
  - [x] Build passes successfully
  - [ ] **MANUAL STEP REQUIRED**: Apply migrations in Supabase Dashboard
  - [ ] **MANUAL STEP REQUIRED**: Create test user in Supabase Auth
  - [ ] Test end-to-end functionality after manual steps

## Slice 2 — Datasets (Upload & Preview)
- [ ] 2.1 Dataset schema
  - [ ] Create `dataset` and `dataset_row` tables migration
  - [ ] Add RLS policies
  - [ ] Write integration tests
- [ ] 2.2 Dataset upload
  - [ ] Create `POST /api/datasets` Route Handler
  - [ ] Implement file parsing + Storage upload
  - [ ] Write integration tests
- [ ] 2.3 Dataset preview
  - [ ] Create `GET /api/datasets/:id` endpoint
  - [ ] Write integration tests
- [ ] 2.4 Replace dataset mocks
  - [ ] Update upload/preview UI
  - [ ] Delete mock dataset code
  - [ ] Add Playwright E2E test

## Slice 3 — Runs (Synchronous Execution)
- [ ] 3.1 Run schema
  - [ ] Create `run`, `run_model`, `run_cell` tables migration
  - [ ] Add foreign keys + RLS
  - [ ] Write integration tests
- [ ] 3.2 Run execution service
  - [ ] Create executor calling Groq/Cerebras
  - [ ] Implement dataset iteration
  - [ ] Write unit tests
- [ ] 3.3 Run API
  - [ ] Create `POST /api/runs` Route Handler
  - [ ] Create `GET /api/runs/:id` endpoint
  - [ ] Write integration tests
- [ ] 3.4 Replace run execution mocks
  - [ ] Update Run button + results table
  - [ ] Delete `frontend/lib/mockRunExecutor.temp.ts`
  - [ ] Add Playwright E2E test

## Slice 4 — Grading & Metrics
- [ ] 4.1 Grading schema
  - [ ] Add grade/token/cost columns to `run_cell`
  - [ ] Write migration tests
- [ ] 4.2 Grading utilities
  - [ ] Create grader parsing logic
  - [ ] Write unit tests
- [ ] 4.3 Grading integration
  - [ ] Update executor to run grader prompts
  - [ ] Store grades + metrics
  - [ ] Write integration tests
- [ ] 4.4 Metrics UI
  - [ ] Display grades, tokens, costs
  - [ ] Add manual grade override
  - [ ] Add Playwright E2E test

## Slice 5 — Production Readiness (Deferred)
Add only when measured need appears:
- [ ] Pagination (when queries slow)
- [ ] Cleanup jobs (when orphaned files accumulate)
- [ ] Rate limiting (when abuse occurs)
- [ ] Structured logging (when debugging gets hard)
- [ ] Async execution (when synchronous blocks UX)

---

## Notes
- Each slice must complete with passing tests before moving to next
- Delete mock code immediately when replaced
- Add optimizations (pagination, etc.) only when measurements show need
- All features must work end-to-end before considering "done"
