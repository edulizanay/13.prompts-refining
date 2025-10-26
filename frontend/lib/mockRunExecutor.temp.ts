// ABOUTME: TEMP mock execution layer - generates cell data asynchronously
// ABOUTME: Will be replaced with real API calls in Phase 2; enforces single active run

import { Run, Cell, Dataset } from './types';
import { upsertCell, getPromptById } from './mockRepo.temp';
import { normalizeGrade } from './utils';

export type ExecutionUpdate = (cell: Cell) => void;

/**
 * Generate mock grader output
 */
export function generateMockGrader(): { thinking: string; response: string } {
  const gradeOptions = [
    { thinking: 'The response is well-structured and comprehensive.', response: 'Yes' },
    { thinking: 'The response has some issues but is mostly correct.', response: 'Partial' },
    { thinking: 'The response does not meet the requirements.', response: 'No' },
    { thinking: 'This is a high-quality response that exceeds expectations.', response: '5' },
    { thinking: 'This is an average response that meets basic requirements.', response: '3' },
    { thinking: 'This response is below expectations.', response: '1' },
  ];

  return gradeOptions[Math.floor(Math.random() * gradeOptions.length)];
}

/**
 * Generate mock cell data for a single execution
 */
export function generateMockCell(): Partial<Cell> {
  // Random output (mostly successful, ~5% error rate)
  const isError = Math.random() < 0.05;

  if (isError) {
    const errorMessages = [
      'Rate limit exceeded',
      'API timeout',
      'Invalid request',
      'Authentication failed',
      'Service unavailable',
    ];
    return {
      status: 'error' as const,
      output_raw: '',
      output_parsed: '',
      tokens_in: 0,
      tokens_out: 0,
      cost: 0,
      latency_ms: Math.floor(Math.random() * 3000) + 500,
      error_message: errorMessages[Math.floor(Math.random() * errorMessages.length)],
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
    const grader = run.grader_id ? getPromptById(run.grader_id) : null;

    // Execute cells in sequence (for simplicity)
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      for (let columnIndex = 0; columnIndex < models.length; columnIndex++) {
        const modelId = models[columnIndex];
        try {
          // Create cell in 'running' state
          const cell: Cell = {
            run_id: run.id,
            model_id: modelId,
            column_index: columnIndex,
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
            manual_grade: null,
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

          // If cell is OK and grader selected, run grader
          let finalCell = updatedCell;
          if (updatedCell.status === 'ok' && grader) {
            // Simulate grader delay
            const graderDelay = Math.floor(Math.random() * 500) + 300;
            await new Promise((resolve) => setTimeout(resolve, graderDelay));

            // Generate grader output
            const graderOutput = generateMockGrader();
            const graderFullRaw = `<thinking>${graderOutput.thinking}</thinking>\n<response>${graderOutput.response}</response>`;
            const gradedValue = normalizeGrade(graderOutput.response);

            finalCell = {
              ...updatedCell,
              graded_value: gradedValue,
              grader_full_raw: graderFullRaw,
              grader_parsed: graderOutput.response,
            };
          }

          // Save to repo
          upsertCell(finalCell);
          onCellUpdate(finalCell);
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
