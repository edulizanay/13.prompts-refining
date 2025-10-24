## About: frontend/lib/

Business logic, utilities, types, and TEMP mocks for Phase 1.

### Core Files

**types.ts** ⭐ AUTHORITATIVE
- All TypeScript interfaces and types
- This is the single source of truth for data shapes
- Types: PromptType, CellStatus, MetricView, ExpectedOutput
- Interfaces: Prompt, Dataset, Model, Run, Cell, UIState
- NO logic, just type definitions

**utils.ts** - Business Utilities
- `extractPlaceholders(text: string): string[]` — Regex to find {{vars}}
- `parseOutput(raw: string, expectedOutput: ExpectedOutput): { parsed: string | null, isMalformed: boolean }`
  - Handles None / `<response>` / JSON parsing
  - Returns `isMalformed=true` if parse fails under the selected mode
- `validateRun(prompt: Prompt, dataset: Dataset | null, grader: Prompt | null): string[]`
  - Runtime validation before Run
  - Generator placeholders ⊆ dataset headers (if dataset present)
  - Grader placeholders ⊆ (dataset headers ∪ {`output`})
- `normalizeGrade(response: string): number`
  - Yes → 1.0, No → 0.0, 1–5 → (score-1)/4
- Formatters:
  - `formatTokens(tokensIn: number, tokensOut: number): string` → `"12k | 0.5k"`
  - `formatCost(cost: number): string` → `"$0.0023"`
  - `formatLatency(ms: number): string` → `"1.2s"`
  - `formatGrade(grade: number): string` → `"85%"`
- `gradeToColor(grade: number): string` — Maps 0–1 to red/yellow/green

**mockRepo.temp.ts** ⚠️ TEMPORARY (Phase 1 only)
- localStorage CRUD for ALL entities
- Functions:
  - Prompts: `createPrompt()`, `getPrompt()`, `updatePrompt()`, `deletePrompt()`, `listPrompts()`
  - Datasets: `createDataset()`, `getDataset()`, `updateDataset()`, `deleteDataset()`, `listDatasets()`
  - Runs: `createRun()`, `getRun()`, `updateRun()`, `deleteRun()`, `listRuns()`
  - Cells: `createCell()`, `getCell()`, `updateCell()`, `deleteCell()`, `getCellsByRun()`
  - UIState: `getUIState()`, `setUIState()`
- Seed data generator: `initializeSeedData()`
- ID generation: `generateId(prefix: string): string`
- **Version bump logic**: Only on Run, not on edit
- **Rename semantics**: Reset `version_counter` to 1 when name changes
- **Auto-prune**: Keep last 50 runs per prompt
- **Quota management**: Monitor localStorage usage

**mockRunExecutor.temp.ts** ⚠️ TEMPORARY (Phase 1 only)
- Simulates async prompt execution
- `executeRun(run: Run, dataset: Dataset | null, prompt: Prompt, grader: Prompt | null): Promise<void>`
  - For each model × row: generates mock cell data
  - Random delay 500–2000ms per cell
  - Error rate ~5%; malformed depends on expectedOutput (e.g., missing `<response>` / invalid JSON)
  - If grader: auto-runs after generator (300–800ms delay)
  - Persists via mockRepo
  - Clears `activeRunId` when all cells are terminal
- `rerunCell(runId: string, modelId: string, rowIndex: number): Promise<void>`
  - **Bypasses cache**
  - Regenerates and overwrites the cell (allowed only for terminal cells of the **active** run)
- **Single active run guard**:
  - Blocks new runs if `UIState.activeRunId !== null`
- **Mock data**:
  - Random output (capped ≤10–20 KB)
  - `tokens_in` (1000–5000), `tokens_out` (200–2000)
  - `cost = tokens_in * 0.000001 + tokens_out * 0.000003`
  - `latency_ms` = 500–3000

**parseCSV.ts** (optional; or inline in utils.ts)
- `parseCSV(file: File): Promise<{ headers: string[], rows: Record<string, string>[] }>`
- Uses Papa Parse or similar
- Returns first 50 rows for preview
- Validates headers exist

### File Naming Convention
- `.temp.ts` suffix = will be removed in Phase 2
- Regular `.ts` = stays in Phase 2

### Migration Plan (Phase 2)
- `mockRepo.temp.ts` → Supabase repos with RLS
- `mockRunExecutor.temp.ts` → Queue/Worker + Provider Adapters + Realtime
- `utils.ts` stays (business logic is permanent)
- `types.ts` stays (may be extended for API types)

### Principles
- Keep files cohesive (utils are utilities, mocks are mocks)
- Don’t split prematurely — split only when file > 500 lines
- Types live in ONE place (`types.ts`)
- Business logic lives in `utils.ts`
- TEMP files are clearly marked
