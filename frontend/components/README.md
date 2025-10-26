## About: frontend/components/

React components for the UI. Keep components focused and composable.

### Left Panel Components

**EditorPanel.tsx**
- Container for entire left panel
- Contains: PromptHeader, ExpectedOutputSelector, PromptEditor, VariableChips, DatasetSelector, GraderSelector, RunButton
- Orchestrates editor interactions

**PromptHeader.tsx**
- Displays: name (editable inline), type badge, version label
- On name edit: saves to mockRepo **and resets version_counter to 1**

**ExpectedOutputSelector.tsx**
- Dropdown: None | <response> | JSON
- Saves to `prompt.expected_output`
- Helper text about malformed detection

**PromptEditor.tsx**
- Markdown textarea with autosave on blur (500ms debounce)
- Monospace font, auto-expand
- Extracts placeholders on text change

**VariableChips.tsx**
- Read-only badges showing detected `{{placeholders}}`
- Gray for generator vars, purple for grader vars

**DatasetSelector.tsx**
- Dropdown listing datasets + upload button
- Click dataset name → opens preview modal
- Upload parses CSV/JSON via `lib/utils` (or `parseCSV.ts`)

**GraderSelector.tsx**
- Dropdown filtered to type='grader' prompts
- Nullable ("No grader" option)

**RunButton.tsx**
- Primary button **"Run"** with shadcn loading state
- Disabled if no models **OR** if `activeRunId` set
- When active: shows spinner + text **"Loading…"**

### Right Panel Components

**ResultsGrid.tsx**
- Table with model columns as headers (click to edit, hover × to remove)
- "+" header cell to add models (max 4)
- Rows = dataset rows (or 1 for live)
- Renders even when run is null (shows "No data" in cells)
- Internally manages model selection with embedded dialog
- Internally contains: **ParsedFullToggle (global)**, MetricToggle, ResultCell components, SummaryRow
- Accepts `isHistorical` prop to disable interactions

**ParsedFullToggle.tsx (global)**
- Toolbar toggle that switches the entire grid between **Full Output** and **Parsed Response**
- Modal mirrors this selection (no per-cell toggle)

**ResultCell.tsx**
- Shows loading skeleton → truncated output → double-click to expand modal
- Hover shows CellOverlay with re-run + metric badges
- Handles status: `idle` / `running` / `ok` / `error` / `malformed`
- Malformed: warning badge + tooltip

**CellOverlay.tsx**
- Appears on cell hover
- Top-right: re-run icon
- Bottom-right: metric badge (dynamic based on MetricToggle)
- If graded_value exists: shows GraderBadge

**CellExpandModal.tsx**
- Dialog showing full output **in the current global view** (Full or Parsed)
- No per-cell Parsed/Full toggle

**GraderBadge.tsx**
- Colored badge: red (0.0–0.4), yellow (0.4–0.7), green (0.7–1.0)
- Optional tooltip with brief grader `<response>` snippet
- **No flip interaction in Phase 1**

**MetricToggle.tsx**
- Button group: Grade | Tokens | Cost | Latency
- Defaults to Grade (not persisted)
- Updates cell badges when changed

**SummaryRow.tsx**
- Renders below grid
- **Shows averages per model column**
  - **Tokens: `avg_in | avg_out`**
  - Excludes error/malformed cells from averages
- Footer label: **"Summary (Average)"**

### Supporting Components

**DatasetPreviewModal.tsx**
- Dialog showing first 50 rows of dataset
- Scrollable table with headers

**ModelColumn.tsx**
- Header for results grid columns
- Shows provider + model name + remove (X) button

**HistoryTab.tsx**
- List of past runs (sorted newest first)
- Click to load historical view
- Shows: **version_label**, model count (**no timestamps in Phase 1**)

### Component Principles
- Keep components small and focused
- Business logic lives in `lib/utils.ts` or `lib/mockRepo.temp.ts`
- Components should be mostly presentational
- Use shadcn/ui primitives (Button, Dialog, Tooltip, Badge, etc.)
