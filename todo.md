# Prompt Refinement Backend TODO

## Current Focus
**Mode**: Supabase-backed implementation (YAGNI approach)
**Current Slice**: Slice 1 — Prompts (Basic CRUD)
**Owner**: Edu + Claude
**Last Updated**: 2025-10-26

---

## Slice 1 — Prompts (Basic CRUD)
- [ ] 1.1 Supabase project setup
  - [ ] Run `supabase init`
  - [ ] Create `prompt` table migration with RLS
  - [ ] Verify `supabase db reset` works
- [ ] 1.2 Prompt data layer
  - [ ] Create Supabase client modules (browser + server)
  - [ ] Create `frontend/lib/data/prompts.ts` with CRUD functions
  - [ ] Write integration tests for CRUD + RLS
- [ ] 1.3 Replace prompt mocks
  - [ ] Update UI to use new data layer
  - [ ] Delete `frontend/lib/mockRepo.temp.ts` prompt code
  - [ ] Add Playwright E2E test

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
