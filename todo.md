# Prompt Refinement UI - Todo Tracker

## Phase 1: UI-Only Implementation (CURRENT PHASE)

**Status**: Ready to begin
**Goal**: Build complete UI with localStorage mock, validate with Edu before backend work

---

## Prompt Completion Checklist

### Foundation & Core Setup

* [ ] **Prompt 1**: Foundation & Project Setup + State Management
* [ ] **Prompt 2**: Editor Panel - Basic Prompt Editing
* [ ] **Prompt 3**: Variable Detection & Dataset Selector
* [ ] **Prompt 4**: Dataset Upload & Preview
* [ ] **Prompt 5**: Grader Selector

### Model & Run Management

* [ ] **Prompt 6**: Model Selection
* [ ] **Prompt 7**: Run Validation & Execution
* [ ] **Prompt 8**: Results Grid Structure & Mock Execution

### Results Display

* [ ] **Prompt 9**: Cell Content Display & Expand
* [ ] **Prompt 10**: Cell Overlays & Badges
* [ ] **Prompt 11**: Grader Integration
* [ ] **Prompt 12**: Metric Views & Summary Row

### Polish & Testing

* [ ] **Prompt 13**: Error Handling & Display
* [ ] **Prompt 14**: Run History
* [ ] ~~**Prompt 15**: Dataset Management Polish~~ **(Removed from Phase 1)**
* [ ] **Prompt 16**: UX Polish & Keyboard Shortcuts
* [ ] **Prompt 17**: End-to-End Testing & Final Integration

---

## Current Prompt

**Active**: None (awaiting start)
**Next**: Prompt 1 - Foundation & Project Setup + State Management

---

## Phase 1 Success Criteria

Before presenting to Edu for validation:

* [ ] All prompts (excluding 15) implemented
* [ ] All tests passing
* [ ] No console errors
* [ ] Build succeeds (`npm run build`)
* [ ] Manual testing complete (full flow works)
* [ ] localStorage persists correctly
* [ ] Seed data loads on first visit
* [ ] Can create and edit prompts (generator and grader)
* [ ] Can upload and preview datasets
* [ ] Can select multiple models for comparison
* [ ] Can run prompts against datasets
* [ ] Results grid populates with mock data
* [ ] **Global Parsed/Full toggle** affects all cells (no per-cell toggle)
* [ ] **Summary (Average)** row shows averages for all metrics; **Tokens** as **avg_in | avg_out**
* [ ] Grader auto-runs; colored badge shown
* [ ] **Validation** blocks invalid runs with clear errors
* [ ] **Single Active Run** enforced; Run button shows **“Loading…”** while active
* [ ] **Re-run** allowed only for **terminal cells of the active run**; disabled in **History**
* [ ] **History** available via **tabs**, read-only (no overlays/re-run)
* [ ] All UI interactions feel smooth and complete
* [ ] No obvious bugs or broken states

---

## Blockers & Notes

### Current Blockers

None — ready to start

### Notes

* Execute prompts sequentially
* Commit after each prompt completion
* Run tests after each prompt
* Do not skip ahead

---

## Phase 2: Backend Integration (FUTURE)

**Status**: NOT STARTED
**Blocked by**: Phase 1 completion + Edu's approval

Will include:

* Supabase setup
* Auth flow
* API key management
* Real provider calls (OpenAI, Anthropic)
* Realtime cell updates

---

## Phase 3: Hardening (FUTURE)

**Status**: NOT STARTED
**Blocked by**: Phase 2 completion

Will include:

* Retry logic with exponential backoff
* Caching implementation
* Advanced error handling
* Performance optimization

---

## Last Updated

**Date**: 2025-10-24
**By**: Claude (Initial plan creation) / Updated per plan alignment
