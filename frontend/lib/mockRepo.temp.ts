// ABOUTME: TEMP localStorage CRUD for Runs, Cells
// ABOUTME: Will be replaced with Supabase repos in Phase 2; DO NOT add business logic here
// NOTE: Prompt-related functions have been moved to lib/services/prompts.client.ts (uses Supabase)
// NOTE: Dataset-related functions have been moved to lib/services/datasets.client.ts (uses Supabase)

import { Run, Cell, UIState, MetricView, Model } from './types';

const STORAGE_KEYS = {
  RUNS: 'runs',
  CELLS: 'cells',
  MODELS: 'models',
  UI_STATE: 'ui_state',
  INITIALIZED: 'initialized',
};

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// RUNS

export function getAllRuns(): Run[] {
  const data = localStorage.getItem(STORAGE_KEYS.RUNS);
  return data ? JSON.parse(data) : [];
}

export function getRunById(id: string): Run | null {
  const runs = getAllRuns();
  return runs.find((r) => r.id === id) || null;
}

export function getRunsByPromptId(promptId: string): Run[] {
  const runs = getAllRuns();
  return runs
    .filter((r) => r.prompt_id === promptId)
    .sort((a, b) => {
      // Sort by creation time (newest first)
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
}

export function createRun(
  promptId: string,
  versionLabel: string,
  modelIds: string[],
  datasetId: string | null = null,
  graderId: string | null = null
): Run {
  const run: Run = {
    id: generateId('run'),
    prompt_id: promptId,
    version_label: versionLabel,
    dataset_id: datasetId,
    model_ids: modelIds,
    grader_id: graderId,
    created_at: new Date().toISOString(),
  };
  let runs = getAllRuns();
  runs.push(run);

  // Auto-prune: keep last 50 runs per prompt
  const promptRuns = runs.filter((r) => r.prompt_id === promptId);
  if (promptRuns.length > 50) {
    const toDelete = promptRuns.slice(50).map((r) => r.id);
    runs = runs.filter((r) => !toDelete.includes(r.id));
  }

  localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(runs));
  return run;
}

export function deleteRun(id: string): boolean {
  const runs = getAllRuns();
  const filtered = runs.filter((r) => r.id !== id);
  if (filtered.length === runs.length) return false;
  localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(filtered));
  return true;
}

// CELLS

function getCellKey(runId: string, columnIndex: number, rowIndex: number): string {
  return `${runId}:${columnIndex}:${rowIndex}`;
}

export function getCellsByRunId(runId: string): Cell[] {
  const data = localStorage.getItem(STORAGE_KEYS.CELLS);
  if (!data) return [];
  const cells = JSON.parse(data) as Record<string, Cell>;
  return Object.values(cells).filter((c) => c.run_id === runId);
}

export function getCell(runId: string, columnIndex: number, rowIndex: number): Cell | null {
  const data = localStorage.getItem(STORAGE_KEYS.CELLS);
  if (!data) return null;
  const cells = JSON.parse(data) as Record<string, Cell>;
  const key = getCellKey(runId, columnIndex, rowIndex);
  return cells[key] || null;
}

export function upsertCell(cell: Cell): Cell {
  const data = localStorage.getItem(STORAGE_KEYS.CELLS);
  const cells = data ? JSON.parse(data) : ({} as Record<string, Cell>);
  const key = getCellKey(cell.run_id, cell.column_index, cell.row_index);
  cells[key] = cell;
  localStorage.setItem(STORAGE_KEYS.CELLS, JSON.stringify(cells));
  return cell;
}

export function deleteCellsByColumnIndex(runId: string, columnIndex: number): void {
  const data = localStorage.getItem(STORAGE_KEYS.CELLS);
  if (!data) return;

  const cells = JSON.parse(data) as Record<string, Cell>;
  const filteredCells: Record<string, Cell> = {};

  // Keep all cells except those matching the run_id and column_index
  for (const [key, cell] of Object.entries(cells)) {
    if (!(cell.run_id === runId && cell.column_index === columnIndex)) {
      filteredCells[key] = cell;
    }
  }

  localStorage.setItem(STORAGE_KEYS.CELLS, JSON.stringify(filteredCells));
}

export function shiftCellColumnIndices(runId: string, removedColumnIndex: number): void {
  const data = localStorage.getItem(STORAGE_KEYS.CELLS);
  if (!data) return;

  const cells = JSON.parse(data) as Record<string, Cell>;
  const updatedCells: Record<string, Cell> = {};

  for (const [, cell] of Object.entries(cells)) {
    if (cell.run_id === runId && cell.column_index > removedColumnIndex) {
      // Shift down cells that were to the right of the removed column
      const updatedCell = { ...cell, column_index: cell.column_index - 1 };
      const newKey = getCellKey(updatedCell.run_id, updatedCell.column_index, updatedCell.row_index);
      updatedCells[newKey] = updatedCell;
    } else {
      // Keep other cells as-is
      const key = getCellKey(cell.run_id, cell.column_index, cell.row_index);
      updatedCells[key] = cell;
    }
  }

  localStorage.setItem(STORAGE_KEYS.CELLS, JSON.stringify(updatedCells));
}

// UI STATE

export function getUIState(): UIState {
  const data = localStorage.getItem(STORAGE_KEYS.UI_STATE);
  if (data) {
    return JSON.parse(data);
  }
  // Default
  return {
    metricView: 'grade',
    showParsedOnly: false,
    activeRunId: null,
  };
}

export function setUIState(state: UIState): void {
  localStorage.setItem(STORAGE_KEYS.UI_STATE, JSON.stringify(state));
}

export function setMetricView(view: MetricView): void {
  const state = getUIState();
  state.metricView = view;
  setUIState(state);
}

export function setShowParsedOnly(show: boolean): void {
  const state = getUIState();
  state.showParsedOnly = show;
  setUIState(state);
}

export function setActiveRunId(runId: string | null): void {
  const state = getUIState();
  state.activeRunId = runId;
  setUIState(state);
}

// MODELS

export function getAllModels(): Model[] {
  const data = localStorage.getItem(STORAGE_KEYS.MODELS);
  return data ? JSON.parse(data) : [];
}

export function getModelById(id: string): Model | null {
  const models = getAllModels();
  return models.find((m) => m.id === id) || null;
}

export function createModel(provider: string, model: string): Model {
  const newModel: Model = {
    id: generateId('model'),
    provider,
    model,
  };
  const models = getAllModels();
  models.push(newModel);
  localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(models));
  return newModel;
}

export function deleteModel(id: string): void {
  const models = getAllModels().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(models));
}

export function getModelByProviderAndName(provider: string, model: string): Model | null {
  const models = getAllModels();
  return models.find((m) => m.provider === provider && m.model === model) || null;
}

export function deduplicateModels(): void {
  const models = getAllModels();
  const seen = new Map<string, Model>();

  // Keep first occurrence of each provider+model combo
  models.forEach((model) => {
    const key = `${model.provider}|${model.model}`;
    if (!seen.has(key)) {
      seen.set(key, model);
    }
  });

  const deduplicated = Array.from(seen.values());
  localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(deduplicated));
}

// SEED DATA

export function initializeSeedData(): void {
  const alreadyInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (alreadyInit) return;

  // NOTE: Prompts are now managed via Supabase API
  // Seed prompts should be created via the UI or API routes after authentication

  // NOTE: Datasets are now managed via Supabase API
  // Seed datasets should be uploaded via the UI file upload after authentication

  // Initialize with latest models
  // Cerebras Systems (Cerebras API)
  createModel('Cerebras Systems', 'gpt-oss-120b');
  createModel('Cerebras Systems', 'llama3.1-8b');
  createModel('Cerebras Systems', 'llama-3.3-70b');

  // Groq Inc. (Groq OpenAI-compatible API)
  createModel('Groq Inc.', 'openai/gpt-oss-20b');
  createModel('Groq Inc.', 'openai/gpt-oss-120b');
  createModel('Groq Inc.', 'llama-3.3-70b-versatile');

  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}
