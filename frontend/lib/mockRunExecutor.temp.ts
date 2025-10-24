// ABOUTME: TEMP mock execution layer - generates cell data asynchronously
// ABOUTME: Will be replaced with real API calls in Phase 2; enforces single active run

import { Run, Cell, Dataset } from './types';
import { upsertCell } from './mockRepo.temp';

export type ExecutionUpdate = (cell: Cell) => void;

/**
 * Generate mock cell data for a single execution
 */
export function generateMockCell(): Partial<Cell> {
  // Random output (mostly successful, ~5% error rate)
  const isError = Math.random() < 0.05;

  if (isError) {
    return {
      status: 'error' as const,
      output_raw: '',
      output_parsed: '',
      tokens_in: Math.floor(Math.random() * 100),
      tokens_out: Math.floor(Math.random() * 50),
      cost: Math.random() * 0.01,
      latency_ms: Math.floor(Math.random() * 3000) + 500,
      error_message: ['Rate limit exceeded', 'API timeout', 'Invalid request'][
        Math.floor(Math.random() * 3)
      ],
    };
  }

  // Successful response
  const outputLength = Math.floor(Math.random() * 500) + 200;
  const output = Array(outputLength)
    .fill(0)
    .map(() => 'Lorem ipsum dolor sit amet consectetur.')
    .join(' ');

  return {
    status: 'ok' as const,
    output_raw: output,
    output_parsed: output,
    tokens_in: Math.floor(Math.random() * 200) + 50,
    tokens_out: Math.floor(Math.random() * 100) + 20,
    cost: Math.random() * 0.005 + 0.0001,
    latency_ms: Math.floor(Math.random() * 2000) + 500,
    error_message: null,
  };
}

/**
 * Execute a run asynchronously, updating cells as they complete
 */
export async function executeRun(
  run: Run,
  dataset: Dataset | null,
  onCellUpdate: ExecutionUpdate,
  onComplete: () => void
): Promise<void> {
  try {
    const models = run.model_ids;
    const rows = dataset ? dataset.rows : [{}]; // 1 row if no dataset

    // Execute cells in sequence (for simplicity)
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      for (const modelId of models) {
        try {
          // Create cell in 'running' state
          const cell: Cell = {
            run_id: run.id,
            model_id: modelId,
            row_index: rowIndex,
            status: 'running' as const,
            output_raw: '',
            output_parsed: '',
            tokens_in: 0,
            tokens_out: 0,
            cost: 0,
            latency_ms: 0,
            error_message: null,
            graded_value: null,
            grader_full_raw: null,
            grader_parsed: null,
          };

          upsertCell(cell);
          onCellUpdate(cell);

          // Simulate execution delay
          const delay = Math.floor(Math.random() * 1500) + 500;
          await new Promise((resolve) => setTimeout(resolve, delay));

          // Generate mock data
          const mockData = generateMockCell();
          const updatedCell: Cell = {
            ...cell,
            ...mockData,
          };

          // Save to repo
          upsertCell(updatedCell);
          onCellUpdate(updatedCell);
        } catch (error) {
          console.error(`Error executing cell for run ${run.id}:`, error);
        }
      }
    }

    // All cells completed
    onComplete();
  } catch (error) {
    console.error('Execution error:', error);
    onComplete();
  }
}
