// ABOUTME: Core TypeScript interfaces for all data shapes
// ABOUTME: Authoritative contracts for Prompts, Datasets, Runs, Cells, Models, and UI state

export type PromptType = 'generator' | 'grader';
export type CellStatus = 'idle' | 'running' | 'ok' | 'error' | 'malformed';
export type MetricView = 'grade' | 'tokens' | 'cost' | 'latency';
export type ExpectedOutput = 'none' | 'response' | 'json';

export interface Prompt {
  id: string;
  name: string;
  type: PromptType;
  text: string;
  expected_output: ExpectedOutput;
  version_counter: number;
  created_at: string;
  updated_at: string;
}

export interface Dataset {
  id: string;
  name: string;
  source: 'upload' | 'manual';
  headers: string[];
  row_count: number;
  rows: Record<string, string>[]; // first 50 rows for preview
}

export interface Model {
  id: string;
  provider: string;
  model: string;
}

export interface Run {
  id: string;
  prompt_id: string;
  version_label: string;
  dataset_id: string | null;
  model_ids: string[];
  grader_id: string | null;
  created_at?: string;
}

export interface Cell {
  run_id: string;
  model_id: string;
  row_index: number;
  status: CellStatus;
  output_raw: string;
  output_parsed: string;
  tokens_in: number;
  tokens_out: number;
  cost: number;
  latency_ms: number;
  error_message: string | null;
  graded_value: number | null; // 0..1
  grader_full_raw: string | null;
  grader_parsed: string | null;
  manual_grade: number | null; // 0..1, user-set manual toggle (0=fail, 1=pass)
}

export interface UIState {
  metricView: MetricView; // default 'grade'; not persisted
  showParsedOnly: boolean; // global Parsed/Full
  activeRunId: string | null; // single active run guard
}
