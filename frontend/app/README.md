## About: frontend/app/

Next.js App Router pages and layouts live here.

### Key Files

**layout.tsx**
- App shell with providers (Tailwind, shadcn theme)
- Global layout wrapper
- No business logic

**page.tsx**
- Main screen orchestrator
- Wires left panel (editor) and right panel (results grid)
- Holds state: selected prompt, models, dataset, grader, **global Parsed/Full view**, metric view, run status
- Binds Cmd/Ctrl+Enter keyboard shortcut (Run)
- Calls mockRepo and mockRunExecutor
- Enforces **Single Active Run**: while `activeRunId` is set, Run is disabled and shows **"Loading…"**
- **Minimal business logic** — wiring only; business rules live in `lib/`

### Responsibilities
- Page-level state management (what's selected, what's active)
- Coordinate components
- Trigger actions (Run, save, load)
- Provide right-panel toolbar: **ParsedFullToggle (global)** + MetricToggle
- NO complex business logic (that lives in `lib/`)
