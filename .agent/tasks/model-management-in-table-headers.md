# Model Management in Table Headers – Implementation Plan

## Intent
Fold model selection into the ResultsGrid table so the headers both describe the current columns and let users choose which models will be included in the next run. This removes the ModelManager cards and keeps the panel slimmer while preserving the ability to manage 1–4 models.

## Current Problems
- Model choices appear twice (ModelManager cards and ResultsGrid headers), which wastes space and confuses the flow.
- The grid only renders when a run exists, so there is no way to pick models on first load without the separate manager.
- `run.model_ids` defines the displayed columns, which prevents pre‑selecting models for the next run.

## Desired UX
- Right panel shows the toolbar and the ResultsGrid; no separate ModelManager component.
- Table headers list the selected models from left to right, each with an edit affordance and a hover “×” that removes the model when more than one is selected.
- A “+” header cell opens the add dialog until four models are selected; the body cells under that column stay empty.
- The grid renders even before any run data exists; headers reflect `selectedModelIds`, and body cells show “No data” until a matching run completes.

## Implementation Plan
1. **Broaden `ResultsGrid` props** – accept `run: Run | null`, add `selectedModelIds` and `onModelsChange`, and guard every use of `run`.
2. **Own the selection state inside the grid** – initialise once (default to the first available model), enforce the 1–4 model window, and keep selections unique before calling `onModelsChange`.
3. **Replace header rendering** – use lightweight internal components for existing models (click to edit, hover “×” to remove) and for the “+” slot that triggers the add flow.
4. **Reuse the existing dialog UX** – embed the former ModelManager modal inside the grid, feeding it provider/model pickers and wiring its confirm action back into `onModelsChange`.
5. **Update the parent page** – remove the ModelManager import, always render `ResultsGrid`, and pass the shared `selectedModelIds` state straight through.

## Data Flow After Change
`ResultsGrid` headers manage `selectedModelIds` → parent persists the list → runs are launched with that list → grid renders columns based on `selectedModelIds`, showing run data when available.

## Risks & Mitigations
- **Null runs**: double-check every `run` access to avoid runtime errors.
- **Selection invariants**: guard against dropping to zero models or allowing duplicates; failing to do so would leave the user without a valid configuration.
- **Expectation shift**: headers now show “next run” models, so QA/docs should clarify why some columns might temporarily read “No data”.

## Follow‑ups (Optional)
- Decide whether to delete the old `ModelManager` component or keep it temporarily.
- Consider future niceties such as drag-to-reorder or saved presets once the inline management flow proves stable.
