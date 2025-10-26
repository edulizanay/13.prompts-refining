# Frontend Unit Tests Proposal (Lean Update)

## Executive Summary

We are refocusing the frontend test plan so we can land high-value coverage **before tomorrow’s backend rollout** without introducing bloat. The goal is to lock in the user-facing behaviors that already exist, then layer on backend-dependent checks once the new APIs are stable.

Key shifts:
- Cover only **three core flows** right now (`EditorPanel`, `ResultsGrid`, main page coordination).
- Write **scenario-style tests** that assert outcomes (callbacks fired, UI state toggled) instead of micro assertions about styling, timers, or random mock data.
- Keep backend-facing logic minimal until the real implementation ships; use lightweight smoke tests against the temporary mock so refactors stay cheap.
- Aim for **~60% coverage** in this phase and keep the Jest suite under ~15 seconds.

---

## Guiding Principles

- **Behavior over implementation**: Assert what the user or parent component observes. Skip checking specific class names, animation timing, or internal refs.
- **Stable today, extensible tomorrow**: Only lock down flows we know will remain after backend work. Leave integration details and heavy async orchestration for the next iteration.
- **Limit maintenance cost**: Prefer 3–5 high-signal tests per component to sprawling checklists. If an assertion would require excessive mocking or knowledge of internals, drop it.
- **Layer coverage**: Unit smoke tests now, deeper integration/e2e tests later once the backend contract is real.

---

## Phase 1 (Pre-Backend) Test Scope

### 1. EditorPanel (`frontend/components/__tests__/EditorPanel.test.tsx`) — Critical

Focus on user actions that must keep working regardless of backend details:
- **Select and edit prompt** → ensures the selected prompt appears in the editor, updates callbacks on change, and marks the prompt as “dirty”.
- **Create or rename prompt** → verifies modal workflow, validation (no empty names), and that the active prompt switches appropriately.
- **Run request** → when the Run button (or Cmd/Ctrl+Enter) is used, the component validates basic prerequisites and calls `onRunClick`/`onActiveRunIdChange`; the button stays disabled during a run and re-enables on completion.
- **Dataset/model selection** → confirms dropdown selections propagate via callbacks and can be cleared.

Keep assertions at the interaction level; for example, fire a change event and check that the mocked callback received the right payload, rather than inspecting `textIsChangedRef` directly.

### 2. ResultsGrid (`frontend/components/__tests__/ResultsGrid.test.tsx`) — Critical

Lock down the core grid behaviors that surface run results:
- **Render run results** → given rows of mock data, we show the expected cell content and aggregate row with calculated totals.
- **Manual grade override** → toggling pass/fail updates the display and emits an `onManualGradeChange` (or equivalent) callback.
- **Model column management** → adding/removing a model updates visible columns and triggers the parent callback with the new list.
- **Re-run entry point** → clicking a re-run control invokes the provided handler with the correct row/column context (without asserting timer intervals or hover CSS).

Skip styling checks (skeleton borders, badge colors) and polling interval assertions; we just need to know the component requests updates and renders the right data.

### 3. Main Page (`frontend/app/__tests__/page.test.tsx`) — High

Validate cross-component coordination without burying ourselves in implementation details:
- **Initialisation** → confirms seed/mock data loading and that default selections flow into the child components.
- **Run invocation** → simulates a run from the editor and ensures the page passes the right props down (e.g., `activeRunId`, dataset, models) and switches to results view.
- **Keyboard shortcut passthrough** → tests that Cmd/Ctrl+Enter calls the editor’s exposed `triggerRun` while no run is active.
- **Dataset/model sync** → when the grid requests a re-run or manual grade change, state updates and propagates back down on the next render.

Avoid testing CSS transitions, animation locks, or localStorage persistence until those behaviors are finalized.

---

## Minimal Support for Temporary Mocks

- **`mockRunExecutor.temp.test.tsx`**: Keep a single happy-path test (all cells resolve) and one error-path test (a cell fails and we still call `onComplete`). This guards the frontend contract without pinning us to the mock’s randomization quirks.
- **Existing temp repo tests** remain as-is; no extra assertions needed.

We will revisit executor-specific coverage once the backend is live and the temporary mock is retired.

---

## Deferred Until Backend Landing

Hold off on the following until real data flows are in place:
- Fine-grained polling behavior, grader overlays, or latency/cost formatting checks in `ResultsGrid`.
- Upload parsing branches, view-mode transitions, and localStorage fallbacks in the main page.
- UI primitives (`modal`, `button`, `Spinner`, etc.) unless an urgent regression appears.
- Additional `PromptEditor` enhancements (focus/blur, rapid prop changes).

Once backend endpoints and data contracts stabilize, we can decide whether unit tests, integration tests, or a couple of Playwright flows provide the best return.

---

## Metrics & Guardrails

- **Coverage**: Target ~60% statements/branches for this phase; reassess after backend work. Do not add low-value assertions just to move the number.
- **Runtime**: Keep the Jest suite under 15 seconds locally by avoiding extensive timer mocks or large fixture data.
- **Flakiness checks**: Depend on deterministic fixtures and avoid randomness in expectations.

---

## Implementation Order

1. Update test utilities (jest setup, shared mocks) only if a new test explicitly needs them.
2. Implement `EditorPanel` tests.
3. Implement `ResultsGrid` tests.
4. Implement `page` tests.
5. Add the two lightweight `mockRunExecutor.temp` smoke tests.

Revisit scope after the backend is merged; expand or shift to integration tests as needed.

---

## Next Review Checkpoint

After backend logic lands:
- Re-evaluate whether executor behavior or dataset ingestion needs deeper coverage.
- Decide if to introduce Playwright/Cypress smoke flows (e.g., “create prompt → run → see results”) for end-to-end confidence.
- Trim or adjust unit tests if new architecture changes responsibilities.

This staged approach keeps today’s work lean while leaving a clear path for richer tests once the backend implementation is ready.
