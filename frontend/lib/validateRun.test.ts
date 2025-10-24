// ABOUTME: Tests for run validation logic
// ABOUTME: Verifies that validation correctly blocks or allows runs based on vars and datasets

import { validateRun } from './validateRun';
import { Prompt, Dataset } from './types';

describe('validateRun', () => {
  const mockPrompt = (text: string, type: 'generator' | 'grader' = 'generator'): Prompt => ({
    id: 'test-prompt',
    name: 'Test Prompt',
    type,
    text,
    expected_output: 'none',
    version_counter: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const mockDataset = (headers: string[]): Dataset => ({
    id: 'test-dataset',
    name: 'Test Dataset',
    source: 'upload',
    headers,
    row_count: 10,
    rows: [],
  });

  test('allows valid generator with matching dataset columns', () => {
    const prompt = mockPrompt('Hello {{name}}, you are {{age}} years old');
    const dataset = mockDataset(['name', 'age', 'email']);
    const errors = validateRun(prompt, dataset, null);
    expect(errors).toEqual([]);
  });

  test('blocks generator with missing dataset columns', () => {
    const prompt = mockPrompt('Hello {{name}}, you are {{age}} years old');
    const dataset = mockDataset(['name', 'email']);
    const errors = validateRun(prompt, dataset, null);
    expect(errors).toContain('Generator is missing dataset columns: "age"');
  });

  test('blocks generator with variables when no dataset selected', () => {
    const prompt = mockPrompt('Hello {{name}}');
    const errors = validateRun(prompt, null, null);
    expect(errors).toContain('Generator requires variables but no dataset selected');
  });

  test('allows generator with no variables and no dataset', () => {
    const prompt = mockPrompt('Hello world, no variables here');
    const errors = validateRun(prompt, null, null);
    expect(errors).toEqual([]);
  });

  test('allows grader with {{output}} placeholder', () => {
    const generator = mockPrompt('Response: {{text}}');
    const grader = mockPrompt('Grade: {{output}}', 'grader');
    const dataset = mockDataset(['text']);
    const errors = validateRun(generator, dataset, grader);
    expect(errors).toEqual([]);
  });

  test('blocks grader with missing variables', () => {
    const generator = mockPrompt('Response: {{text}}');
    const grader = mockPrompt('Grade: {{output}} and {{missing_var}}', 'grader');
    const dataset = mockDataset(['text']);
    const errors = validateRun(generator, dataset, grader);
    expect(errors).toContain('Grader is missing variables: "missing_var"');
  });

  test('allows grader without {{output}} if it has dataset vars', () => {
    const generator = mockPrompt('No variables');
    const grader = mockPrompt('Use {{text}} to grade', 'grader');
    const dataset = mockDataset(['text']);
    const errors = validateRun(generator, dataset, grader);
    expect(errors).toEqual([]);
  });

  test('blocks grader with variables when no dataset and grader needs dataset columns', () => {
    const generator = mockPrompt('No variables');
    const grader = mockPrompt('Grade using {{dataset_column}}', 'grader');
    const errors = validateRun(generator, null, grader);
    expect(errors).toContain('Grader is missing variables: "dataset_column"');
  });

  test('allows grader with only {{output}} when no dataset', () => {
    const generator = mockPrompt('Generate response');
    const grader = mockPrompt('Grade: {{output}}', 'grader');
    const errors = validateRun(generator, null, grader);
    expect(errors).toEqual([]);
  });

  test('returns multiple errors for multiple missing variables', () => {
    const prompt = mockPrompt('Hello {{a}}, {{b}}, {{c}}');
    const dataset = mockDataset(['a']);
    const errors = validateRun(prompt, dataset, null);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('Generator is missing dataset columns');
    expect(errors[0]).toContain('"b"');
    expect(errors[0]).toContain('"c"');
  });
});
