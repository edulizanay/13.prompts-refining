// ABOUTME: TEMP localStorage CRUD for Prompts, Datasets, Runs, Cells
// ABOUTME: Will be replaced with Supabase repos in Phase 2; DO NOT add business logic here

import { Prompt, Dataset, Run, Cell, UIState, MetricView, Model } from './types';

const STORAGE_KEYS = {
  PROMPTS: 'prompts',
  DATASETS: 'datasets',
  RUNS: 'runs',
  CELLS: 'cells',
  MODELS: 'models',
  UI_STATE: 'ui_state',
  INITIALIZED: 'initialized',
};

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// PROMPTS

export function getAllPrompts(): Prompt[] {
  const data = localStorage.getItem(STORAGE_KEYS.PROMPTS);
  return data ? JSON.parse(data) : [];
}

export function getPromptById(id: string): Prompt | null {
  const prompts = getAllPrompts();
  return prompts.find((p) => p.id === id) || null;
}

export function createPrompt(
  name: string,
  type: 'generator' | 'grader',
  text: string = ''
): Prompt {
  const prompt: Prompt = {
    id: generateId('prompt'),
    name,
    type,
    text,
    expected_output: 'none',
    version_counter: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const prompts = getAllPrompts();
  prompts.push(prompt);
  localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(prompts));
  return prompt;
}

export function updatePrompt(id: string, updates: Partial<Prompt>): Prompt | null {
  const prompts = getAllPrompts();
  const index = prompts.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const prompt = { ...prompts[index], ...updates, updated_at: new Date().toISOString() };
  prompts[index] = prompt;
  localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(prompts));
  return prompt;
}

export function renamePrompt(id: string, newName: string): Prompt | null {
  // Rename resets version counter to 1
  return updatePrompt(id, { name: newName, version_counter: 1 });
}

export function deletePrompt(id: string): boolean {
  const prompts = getAllPrompts();
  const filtered = prompts.filter((p) => p.id !== id);
  if (filtered.length === prompts.length) return false;
  localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(filtered));
  return true;
}

// DATASETS

export function getAllDatasets(): Dataset[] {
  const data = localStorage.getItem(STORAGE_KEYS.DATASETS);
  return data ? JSON.parse(data) : [];
}

export function getDatasetById(id: string): Dataset | null {
  const datasets = getAllDatasets();
  return datasets.find((d) => d.id === id) || null;
}

export function createDataset(
  name: string,
  headers: string[],
  rows: Record<string, string>[],
  source: 'upload' | 'manual' = 'upload'
): Dataset {
  const dataset: Dataset = {
    id: generateId('dataset'),
    name,
    source,
    headers,
    row_count: rows.length,
    rows: rows.slice(0, 50), // cap at 50 for preview
  };
  const datasets = getAllDatasets();
  datasets.push(dataset);
  localStorage.setItem(STORAGE_KEYS.DATASETS, JSON.stringify(datasets));
  return dataset;
}

export function updateDataset(id: string, updates: Partial<Dataset>): Dataset | null {
  const datasets = getAllDatasets();
  const index = datasets.findIndex((d) => d.id === id);
  if (index === -1) return null;

  const dataset = { ...datasets[index], ...updates };
  datasets[index] = dataset;
  localStorage.setItem(STORAGE_KEYS.DATASETS, JSON.stringify(datasets));
  return dataset;
}

export function deleteDataset(id: string): boolean {
  const datasets = getAllDatasets();
  const filtered = datasets.filter((d) => d.id !== id);
  if (filtered.length === datasets.length) return false;
  localStorage.setItem(STORAGE_KEYS.DATASETS, JSON.stringify(filtered));
  return true;
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

function getCellKey(runId: string, modelId: string, rowIndex: number): string {
  return `${runId}:${modelId}:${rowIndex}`;
}

export function getCellsByRunId(runId: string): Cell[] {
  const data = localStorage.getItem(STORAGE_KEYS.CELLS);
  if (!data) return [];
  const cells = JSON.parse(data) as Record<string, Cell>;
  return Object.values(cells).filter((c) => c.run_id === runId);
}

export function getCell(runId: string, modelId: string, rowIndex: number): Cell | null {
  const data = localStorage.getItem(STORAGE_KEYS.CELLS);
  if (!data) return null;
  const cells = JSON.parse(data) as Record<string, Cell>;
  const key = getCellKey(runId, modelId, rowIndex);
  return cells[key] || null;
}

export function upsertCell(cell: Cell): Cell {
  const data = localStorage.getItem(STORAGE_KEYS.CELLS);
  const cells = data ? JSON.parse(data) : ({} as Record<string, Cell>);
  const key = getCellKey(cell.run_id, cell.model_id, cell.row_index);
  cells[key] = cell;
  localStorage.setItem(STORAGE_KEYS.CELLS, JSON.stringify(cells));
  return cell;
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

  // 2 prompts: 1 generator, 1 grader
  const generator = createPrompt(
    'Helpful Assistant',
    'generator',
    'You are a helpful assistant. The user asks: {{user_message}}\n\nRespond professionally and concisely.'
  );
  updatePrompt(generator.id, { expected_output: 'response' });

  createPrompt(
    'Quality Grader',
    'grader',
    'Rate the quality of this response: {{output}}\n\nRespond with either "Yes" or "No".'
  );

  // 1 dataset: 10 rows
  const rows = [
    { user_message: 'What is 2+2?', expected_tone: 'professional' },
    { user_message: 'Tell me a joke', expected_tone: 'humorous' },
    { user_message: 'Explain AI', expected_tone: 'technical' },
    { user_message: 'How to cook pasta?', expected_tone: 'friendly' },
    { user_message: 'What is Python?', expected_tone: 'educational' },
    { user_message: 'Summarize WWII', expected_tone: 'informative' },
    { user_message: 'Write a poem', expected_tone: 'creative' },
    { user_message: 'Best practices?', expected_tone: 'technical' },
    { user_message: 'Hello there', expected_tone: 'casual' },
    { user_message: 'What is quantum computing?', expected_tone: 'technical' },
  ];

  createDataset('Sample Questions', ['user_message', 'expected_tone'], rows);

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
