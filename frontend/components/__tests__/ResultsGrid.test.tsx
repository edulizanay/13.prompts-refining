// ABOUTME: Test suite for ResultsGrid component
// ABOUTME: Verifies grid rendering, manual grade overrides, model management, and re-run functionality

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResultsGrid } from '../ResultsGrid';
import * as mockRepo from '@/lib/mockRepo.temp';
import type { Run, Dataset, Cell, Model } from '@/lib/types';

// Mock the mockRepo module
jest.mock('@/lib/mockRepo.temp', () => ({
  getCellsByRunId: jest.fn(),
  getModelById: jest.fn(),
  upsertCell: jest.fn(),
  getAllModels: jest.fn(),
  createModel: jest.fn(),
  getModelByProviderAndName: jest.fn(),
  deleteCellsByColumnIndex: jest.fn(),
  shiftCellColumnIndices: jest.fn(),
}));

// Mock the executor
jest.mock('@/lib/mockRunExecutor.temp', () => ({
  generateMockCell: jest.fn(() => ({
    status: 'ok' as const,
    output_raw: 'New mock output',
    output_parsed: 'New mock output',
    tokens_in: 150,
    tokens_out: 50,
    cost: 0.002,
    latency_ms: 1200,
    error_message: null,
  })),
}));

describe('ResultsGrid', () => {
  const mockModel1: Model = {
    id: 'model-1',
    provider: 'openai',
    model: 'gpt-4',
  };

  const mockModel2: Model = {
    id: 'model-2',
    provider: 'anthropic',
    model: 'claude-3',
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

  const mockRun: Run = {
    id: 'run-1',
    prompt_id: 'prompt-1',
    version_label: 'Generator 1',
    model_ids: ['model-1', 'model-2'],
    dataset_id: 'dataset-1',
    grader_id: null,
  };

  const mockCells: Cell[] = [
    {
      run_id: 'run-1',
      model_id: 'model-1',
      column_index: 0,
      row_index: 0,
      status: 'ok',
      output_raw: 'Response from GPT-4 for row 1',
      output_parsed: 'Response from GPT-4 for row 1',
      tokens_in: 100,
      tokens_out: 50,
      cost: 0.003,
      latency_ms: 1500,
      error_message: null,
      graded_value: 1.0,
      grader_full_raw: null,
      grader_parsed: null,
      manual_grade: null,
    },
    {
      run_id: 'run-1',
      model_id: 'model-2',
      column_index: 1,
      row_index: 0,
      status: 'ok',
      output_raw: 'Response from Claude for row 1',
      output_parsed: 'Response from Claude for row 1',
      tokens_in: 120,
      tokens_out: 60,
      cost: 0.0025,
      latency_ms: 1300,
      error_message: null,
      graded_value: 0.8,
      grader_full_raw: null,
      grader_parsed: null,
      manual_grade: null,
    },
    {
      run_id: 'run-1',
      model_id: 'model-1',
      column_index: 0,
      row_index: 1,
      status: 'ok',
      output_raw: 'Response from GPT-4 for row 2',
      output_parsed: 'Response from GPT-4 for row 2',
      tokens_in: 110,
      tokens_out: 55,
      cost: 0.0028,
      latency_ms: 1400,
      error_message: null,
      graded_value: 0.9,
      grader_full_raw: null,
      grader_parsed: null,
      manual_grade: null,
    },
    {
      run_id: 'run-1',
      model_id: 'model-2',
      column_index: 1,
      row_index: 1,
      status: 'ok',
      output_raw: 'Response from Claude for row 2',
      output_parsed: 'Response from Claude for row 2',
      tokens_in: 115,
      tokens_out: 58,
      cost: 0.0027,
      latency_ms: 1350,
      error_message: null,
      graded_value: 0.85,
      grader_full_raw: null,
      grader_parsed: null,
      manual_grade: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (mockRepo.getAllModels as jest.Mock).mockReturnValue([mockModel1, mockModel2]);
    (mockRepo.getModelById as jest.Mock).mockImplementation((id) =>
      id === 'model-1' ? mockModel1 : mockModel2
    );
    (mockRepo.getCellsByRunId as jest.Mock).mockReturnValue(mockCells);
  });

  describe('Render run results', () => {
    it('displays grid with correct cell content', async () => {
      const { container } = render(
        <ResultsGrid
          run={mockRun}
          dataset={mockDataset}
          metricView="grade"
          showParsedOnly={false}
          activeRunId="run-1"
          selectedModelIds={['model-1', 'model-2']}
          onModelsChange={jest.fn()}
        />
      );

      // Wait for component to mount and poll cells
      await waitFor(
        () => {
          expect(container.querySelector('table')).toBeInTheDocument();
          // Wait for cells to be loaded via polling (500ms interval)
          expect(screen.queryByText(/Response from GPT-4 for row 1/)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Verify model headers
      expect(screen.getByText(/openai \/ gpt-4/i)).toBeInTheDocument();
      expect(screen.getByText(/anthropic \/ claude-3/i)).toBeInTheDocument();

      // Verify row indices
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('displays aggregate row with calculated totals', async () => {
      render(
        <ResultsGrid
          run={mockRun}
          dataset={mockDataset}
          metricView="grade"
          showParsedOnly={false}
          activeRunId="run-1"
          selectedModelIds={['model-1', 'model-2']}
          onModelsChange={jest.fn()}
        />
      );

      // Wait for cells to load and summary to calculate
      await waitFor(
        () => {
          // Find the summary row (contains "Avg")
          expect(screen.getByText('Avg')).toBeInTheDocument();
          // Summary row should show averaged grades
          // Model 1: (1.0 + 0.9) / 2 = 0.95 = 95%
          expect(screen.getByText('95%')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

  });

  describe('Manual grade override', () => {
    it('calls upsertCell when manual grade is toggled', async () => {
      // Use cells without automated grading to show manual toggle
      const cellsWithoutGrader = mockCells.map((cell) => ({
        ...cell,
        graded_value: null,
        grader_parsed: null,
        grader_full_raw: null,
      }));

      (mockRepo.getCellsByRunId as jest.Mock).mockReturnValue(cellsWithoutGrader);

      const { container } = render(
        <ResultsGrid
          run={mockRun}
          dataset={mockDataset}
          metricView="grade"
          showParsedOnly={false}
          activeRunId="run-1"
          selectedModelIds={['model-1', 'model-2']}
          onModelsChange={jest.fn()}
        />
      );

      // Wait for cells to load and find manual toggle button
      await waitFor(
        () => {
          const thumbsButtons = container.querySelectorAll('svg.lucide-thumbs-up');
          expect(thumbsButtons.length).toBeGreaterThan(0);

          // Click to toggle - should call upsertCell with updated grade
          const firstThumbButton = thumbsButtons[0].closest('button');
          if (firstThumbButton) {
            fireEvent.click(firstThumbButton);
          }
        },
        { timeout: 2000 }
      );

      // Verify upsertCell was called with manual_grade set
      await waitFor(() => {
        expect(mockRepo.upsertCell).toHaveBeenCalled();
        const callArgs = (mockRepo.upsertCell as jest.Mock).mock.calls[0][0];
        expect(callArgs.manual_grade).toBe(1.0);
      });
    });
  });

  describe('Model column management', () => {
    it('calls onModelsChange when model is added', async () => {
      const onModelsChange = jest.fn();
      const newModel: Model = {
        id: 'model-3',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
      };

      (mockRepo.getModelByProviderAndName as jest.Mock).mockReturnValue(null);
      (mockRepo.createModel as jest.Mock).mockReturnValue(newModel);
      (mockRepo.getAllModels as jest.Mock).mockReturnValue([mockModel1, mockModel2, newModel]);

      const { container } = render(
        <ResultsGrid
          run={mockRun}
          dataset={mockDataset}
          metricView="grade"
          showParsedOnly={false}
          activeRunId="run-1"
          selectedModelIds={['model-1', 'model-2']}
          onModelsChange={onModelsChange}
        />
      );

      // Wait for grid and click add button
      await waitFor(() => {
        const addButton = container.querySelector('button[title="Add model"]');
        expect(addButton).toBeInTheDocument();
        if (addButton) {
          fireEvent.click(addButton);
        }
      }, { timeout: 2000 });

      // Modal opens - click the Add button
      await waitFor(() => {
        const addModalButton = screen.getAllByText(/add/i).find(
          (el) => el.tagName === 'BUTTON' && el.textContent === 'Add'
        );
        if (addModalButton) {
          fireEvent.click(addModalButton);
        }
      });

      // Verify model was created and callback triggered
      await waitFor(() => {
        expect(onModelsChange).toHaveBeenCalled();
        const callArgs = onModelsChange.mock.calls[0][0];
        expect(callArgs).toContain('model-3');
      });
    });

    it('calls onModelsChange when model is removed', async () => {
      const onModelsChange = jest.fn();

      const { container } = render(
        <ResultsGrid
          run={mockRun}
          dataset={mockDataset}
          metricView="grade"
          showParsedOnly={false}
          activeRunId="run-1"
          selectedModelIds={['model-1', 'model-2']}
          onModelsChange={onModelsChange}
        />
      );

      // Find and click remove button
      await waitFor(() => {
        const removeButtons = container.querySelectorAll('button[title="Remove model"]');
        expect(removeButtons.length).toBeGreaterThan(0);
        if (removeButtons[0]) {
          fireEvent.click(removeButtons[0]);
        }
      }, { timeout: 2000 });

      // Verify callback was called with updated list
      await waitFor(() => {
        expect(onModelsChange).toHaveBeenCalled();
        const callArgs = onModelsChange.mock.calls[0][0];
        expect(callArgs).toEqual(['model-2']);
      });
    });
  });

  // NOTE: Re-run behavior tests involving hover overlays are deferred per the proposal
  // The hover overlay timing and animation are considered implementation details
  // Real re-run functionality will be tested via integration/e2e tests once backend is stable
});
