// ABOUTME: Unit tests for mockRepo.temp.ts
// ABOUTME: Tests CRUD operations, versioning, and seed data initialization

import {
  generateId,
  getAllPrompts,
  createPrompt,
  updatePrompt,
  renamePrompt,
  deletePrompt,
  getAllDatasets,
  createDataset,
  deleteDataset,
  getAllRuns,
  createRun,
  getRunsByPromptId,
  deleteRun,
  getCell,
  upsertCell,
  getUIState,
  setUIState,
  setMetricView,
  setActiveRunId,
  initializeSeedData,
} from './mockRepo.temp';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('mockRepo.temp', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('generateId', () => {
    it('generates unique IDs with prefix', () => {
      const id1 = generateId('test');
      const id2 = generateId('test');
      expect(id1).toContain('test_');
      expect(id2).toContain('test_');
      expect(id1).not.toBe(id2);
    });
  });

  describe('Prompts CRUD', () => {
    it('creates a prompt', () => {
      const prompt = createPrompt('Test Generator', 'generator', 'Hello {{name}}');
      expect(prompt.name).toBe('Test Generator');
      expect(prompt.type).toBe('generator');
      expect(prompt.text).toBe('Hello {{name}}');
      expect(prompt.version_counter).toBe(1);
    });

    it('retrieves all prompts', () => {
      createPrompt('Prompt 1', 'generator');
      createPrompt('Prompt 2', 'grader');
      const prompts = getAllPrompts();
      expect(prompts).toHaveLength(2);
    });

    it('updates a prompt', () => {
      const prompt = createPrompt('Original', 'generator', 'text');
      updatePrompt(prompt.id, { text: 'Updated text' });
      const updated = getAllPrompts().find((p) => p.id === prompt.id);
      expect(updated?.text).toBe('Updated text');
    });

    it('renames prompt and resets version counter to 1', () => {
      const prompt = createPrompt('Original', 'generator');
      updatePrompt(prompt.id, { version_counter: 5 });
      const renamed = renamePrompt(prompt.id, 'Renamed');
      expect(renamed?.name).toBe('Renamed');
      expect(renamed?.version_counter).toBe(1);
    });

    it('deletes a prompt', () => {
      const prompt = createPrompt('To Delete', 'generator');
      expect(getAllPrompts()).toHaveLength(1);
      const deleted = deletePrompt(prompt.id);
      expect(deleted).toBe(true);
      expect(getAllPrompts()).toHaveLength(0);
    });
  });

  describe('Datasets CRUD', () => {
    it('creates a dataset', () => {
      const rows = [
        { col1: 'val1', col2: 'val2' },
        { col1: 'val3', col2: 'val4' },
      ];
      const dataset = createDataset('Test Dataset', ['col1', 'col2'], rows);
      expect(dataset.name).toBe('Test Dataset');
      expect(dataset.headers).toEqual(['col1', 'col2']);
      expect(dataset.row_count).toBe(2);
      expect(dataset.rows).toHaveLength(2);
    });

    it('caps preview rows at 50', () => {
      const rows = Array.from({ length: 100 }, (_, i) => ({
        id: `row${i}`,
        value: `val${i}`,
      }));
      const dataset = createDataset('Big Dataset', ['id', 'value'], rows);
      expect(dataset.rows).toHaveLength(50);
      expect(dataset.row_count).toBe(100);
    });

    it('deletes a dataset', () => {
      const dataset = createDataset('To Delete', ['col'], [{ col: 'val' }]);
      expect(getAllDatasets()).toHaveLength(1);
      deleteDataset(dataset.id);
      expect(getAllDatasets()).toHaveLength(0);
    });
  });

  describe('Runs CRUD', () => {
    it('creates a run', () => {
      const prompt = createPrompt('Test', 'generator');
      const run = createRun(prompt.id, 'Generator 1', ['model1']);
      expect(run.prompt_id).toBe(prompt.id);
      expect(run.version_label).toBe('Generator 1');
      expect(run.model_ids).toEqual(['model1']);
    });

    it('retrieves runs by prompt ID sorted newest first', async () => {
      const prompt = createPrompt('Test', 'generator');
      const run1 = createRun(prompt.id, 'Gen 1', ['model1']);
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 2));
      const run2 = createRun(prompt.id, 'Gen 2', ['model1']);
      const runs = getRunsByPromptId(prompt.id);
      expect(runs).toHaveLength(2);
      // Newest first (by creation time descending)
      expect(runs[0].id).toBe(run2.id);
      expect(runs[1].id).toBe(run1.id);
    });

    it('deletes a run', () => {
      const prompt = createPrompt('Test', 'generator');
      const run = createRun(prompt.id, 'Gen 1', ['model1']);
      expect(getAllRuns()).toHaveLength(1);
      deleteRun(run.id);
      expect(getAllRuns()).toHaveLength(0);
    });
  });

  describe('Cells CRUD', () => {
    it('upserts and retrieves a cell', () => {
      const cell = {
        run_id: 'run1',
        model_id: 'model1',
        row_index: 0,
        status: 'ok' as const,
        output_raw: 'Hello',
        output_parsed: 'Hello',
        tokens_in: 10,
        tokens_out: 5,
        cost: 0.01,
        latency_ms: 100,
        error_message: null,
        graded_value: null,
        grader_full_raw: null,
        grader_parsed: null,
      };
      upsertCell(cell);
      const retrieved = getCell('run1', 'model1', 0);
      expect(retrieved?.output_raw).toBe('Hello');
    });
  });

  describe('UI State', () => {
    it('returns default UI state', () => {
      const state = getUIState();
      expect(state.metricView).toBe('grade');
      expect(state.showParsedOnly).toBe(false);
      expect(state.activeRunId).toBeNull();
    });

    it('persists UI state', () => {
      setUIState({ metricView: 'tokens', showParsedOnly: true, activeRunId: 'run1' });
      const state = getUIState();
      expect(state.metricView).toBe('tokens');
      expect(state.showParsedOnly).toBe(true);
      expect(state.activeRunId).toBe('run1');
    });

    it('updates metric view', () => {
      setMetricView('cost');
      expect(getUIState().metricView).toBe('cost');
    });

    it('updates active run ID', () => {
      setActiveRunId('newRun');
      expect(getUIState().activeRunId).toBe('newRun');
    });
  });

  describe('Seed Data', () => {
    it('initializes seed data only once', () => {
      initializeSeedData();
      expect(getAllPrompts()).toHaveLength(2);
      expect(getAllDatasets()).toHaveLength(1);

      initializeSeedData();
      expect(getAllPrompts()).toHaveLength(2); // Should not duplicate
    });

    it('creates generator with expected_output', () => {
      initializeSeedData();
      const generator = getAllPrompts().find((p) => p.type === 'generator');
      expect(generator?.expected_output).toBe('response');
    });

    it('creates dataset with correct headers', () => {
      initializeSeedData();
      const dataset = getAllDatasets()[0];
      expect(dataset.headers).toContain('user_message');
      expect(dataset.headers).toContain('expected_tone');
      expect(dataset.rows.length).toBe(10);
    });
  });
});
