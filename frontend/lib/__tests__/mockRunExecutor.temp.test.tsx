// ABOUTME: Smoke tests for mockRunExecutor temporary mock implementation
// ABOUTME: Validates basic happy/error paths without pinning to randomization details

import { executeRun, generateMockCell, generateMockGrader } from '../mockRunExecutor.temp';
import type { Run, Dataset, Cell } from '../types';

describe('mockRunExecutor.temp', () => {
  const mockRun: Run = {
    id: 'test-run-1',
    prompt_id: 'prompt-1',
    version_label: 'Generator 1',
    model_ids: ['model-1'],
    dataset_id: 'dataset-1',
    grader_id: null,
  };

  const mockDataset: Dataset = {
    id: 'dataset-1',
    name: 'Test Dataset',
    headers: ['input', 'expected'],
    rows: [
      { input: 'Test 1', expected: 'Output 1' },
      { input: 'Test 2', expected: 'Output 2' },
    ],
    row_count: 2,
  };

  describe('generateMockCell', () => {
    it('returns a valid cell structure', () => {
      const mockCell = generateMockCell();

      // Should have required fields
      expect(mockCell).toHaveProperty('status');
      expect(mockCell).toHaveProperty('output_raw');
      expect(mockCell).toHaveProperty('tokens_in');
      expect(mockCell).toHaveProperty('tokens_out');
      expect(mockCell).toHaveProperty('cost');
      expect(mockCell).toHaveProperty('latency_ms');

      // Status should be either 'ok' or 'error'
      expect(['ok', 'error']).toContain(mockCell.status);
    });
  });

  describe('generateMockGrader', () => {
    it('returns grader output with thinking and response', () => {
      const graderOutput = generateMockGrader();

      expect(graderOutput).toHaveProperty('thinking');
      expect(graderOutput).toHaveProperty('response');
      expect(typeof graderOutput.thinking).toBe('string');
      expect(typeof graderOutput.response).toBe('string');
    });
  });

  describe('executeRun - happy path', () => {
    it('executes all cells and calls onComplete', async () => {
      const onCellUpdate = jest.fn();
      const onComplete = jest.fn();

      await executeRun(mockRun, mockDataset, onCellUpdate, onComplete);

      // Should call onComplete when done
      expect(onComplete).toHaveBeenCalled();

      // Should have updated cells (2 rows × 1 model = 2 cells)
      // Each cell is updated twice: once as 'running', once as final state
      expect(onCellUpdate).toHaveBeenCalled();
      expect(onCellUpdate.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('executeRun - error handling', () => {
    it('calls onComplete even when execution completes with errors', async () => {
      const onCellUpdate = jest.fn();
      const onComplete = jest.fn();

      // Run with no dataset (edge case)
      await executeRun(mockRun, null, onCellUpdate, onComplete);

      // Should still call onComplete
      expect(onComplete).toHaveBeenCalled();
    });

    it('handles mixed success and error cells without throwing', async () => {
      const onCellUpdate = jest.fn();
      const onComplete = jest.fn();

      // Single execution should handle potential errors gracefully
      // (Mock has ~5% error rate, but we verify behavior regardless)
      await executeRun(mockRun, mockDataset, onCellUpdate, onComplete);

      // Should complete successfully even if some cells error
      expect(onComplete).toHaveBeenCalled();
      expect(onCellUpdate).toHaveBeenCalled();
    });
  });
});
