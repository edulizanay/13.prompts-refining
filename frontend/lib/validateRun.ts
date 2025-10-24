// ABOUTME: Run validation logic - checks prompt vars against dataset and grader vars
// ABOUTME: Blocks invalid runs with clear error messages before execution

import { Prompt, Dataset } from './types';
import { extractPlaceholders } from './utils';

export function validateRun(
  prompt: Prompt,
  dataset: Dataset | null,
  grader: Prompt | null
): string[] {
  const errors: string[] = [];

  // Extract placeholders
  const generatorVars = extractPlaceholders(prompt.text);
  const graderVars = grader ? extractPlaceholders(grader.text) : [];

  // Generator var validation
  if (dataset) {
    const datasetHeaders = new Set(dataset.headers);
    const missingVars = generatorVars.filter((v) => !datasetHeaders.has(v));
    if (missingVars.length > 0) {
      errors.push(
        `Generator is missing dataset columns: ${missingVars.map((v) => `"${v}"`).join(', ')}`
      );
    }
  } else if (generatorVars.length > 0) {
    // Generator requires variables but no dataset selected
    errors.push(`Generator requires variables but no dataset selected`);
  }

  // Grader var validation
  if (grader) {
    const allowedVars = new Set(dataset ? dataset.headers : []);
    allowedVars.add('output'); // Special placeholder for generator output
    const missingVars = graderVars.filter((v) => !allowedVars.has(v));
    if (missingVars.length > 0) {
      errors.push(
        `Grader is missing variables: ${missingVars.map((v) => `"${v}"`).join(', ')}`
      );
    }
  }

  return errors;
}
