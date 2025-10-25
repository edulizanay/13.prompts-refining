// ABOUTME: Unit tests for utility functions (extraction, parsing, formatting, validation)
// ABOUTME: Tests placeholder detection, output parsing, grade normalization, formatting, and run validation

import {
  extractPlaceholders,
  parseOutput,
  normalizeGrade,
  gradeToColor,
  formatGrade,
  formatTokens,
  formatCost,
  formatLatency,
  truncate,
  validateRun,
  parseCSV,
  parseJSON,
  parseDatasetFile,
} from './utils';
import { Prompt, Dataset } from './types';

describe('utils', () => {
  describe('extractPlaceholders', () => {
    it('extracts single placeholder', () => {
      const placeholders = extractPlaceholders('Hello {{name}}');
      expect(placeholders).toEqual(['name']);
    });

    it('extracts multiple placeholders', () => {
      const placeholders = extractPlaceholders('Hello {{name}}, you are {{age}} years old');
      expect(placeholders).toContain('name');
      expect(placeholders).toContain('age');
    });

    it('removes duplicates', () => {
      const placeholders = extractPlaceholders('{{x}} and {{x}} and {{y}}');
      expect(placeholders.length).toBe(2);
      expect(placeholders).toContain('x');
      expect(placeholders).toContain('y');
    });

    it('handles no placeholders', () => {
      const placeholders = extractPlaceholders('Hello world');
      expect(placeholders).toEqual([]);
    });
  });

  describe('parseOutput', () => {
    it('returns raw for none mode', () => {
      const result = parseOutput('Hello world', 'none');
      expect(result.parsed).toBe('Hello world');
      expect(result.isMalformed).toBe(false);
    });

    it('extracts response tags', () => {
      const result = parseOutput('<response>Hello world</response>', 'response');
      expect(result.parsed).toBe('Hello world');
      expect(result.isMalformed).toBe(false);
    });

    it('marks malformed when response tags missing', () => {
      const result = parseOutput('Hello world', 'response');
      expect(result.parsed).toBeNull();
      expect(result.isMalformed).toBe(true);
    });

    it('parses valid JSON', () => {
      const result = parseOutput('{"key": "value"}', 'json');
      expect(result.parsed).toBeDefined();
      expect(result.isMalformed).toBe(false);
    });

    it('marks malformed for invalid JSON', () => {
      const result = parseOutput('not json', 'json');
      expect(result.parsed).toBeNull();
      expect(result.isMalformed).toBe(true);
    });
  });

  describe('normalizeGrade', () => {
    it('converts "Yes" to 1.0', () => {
      expect(normalizeGrade('Yes')).toBe(1.0);
      expect(normalizeGrade('yes')).toBe(1.0);
      expect(normalizeGrade('YES')).toBe(1.0);
    });

    it('converts "No" to 0.0', () => {
      expect(normalizeGrade('No')).toBe(0.0);
      expect(normalizeGrade('no')).toBe(0.0);
      expect(normalizeGrade('NO')).toBe(0.0);
    });

    it('converts 1-5 scale to 0-1', () => {
      expect(normalizeGrade('1')).toBe(0.0);
      expect(normalizeGrade('3')).toBeCloseTo(0.5, 2);
      expect(normalizeGrade('5')).toBe(1.0);
    });

    it('defaults unknown to 0.0', () => {
      expect(normalizeGrade('unknown')).toBe(0.0);
    });
  });

  describe('gradeToColor', () => {
    it('returns green for high grades', () => {
      expect(gradeToColor(0.8)).toBe('green');
      expect(gradeToColor(1.0)).toBe('green');
    });

    it('returns yellow for medium grades', () => {
      expect(gradeToColor(0.5)).toBe('yellow');
      expect(gradeToColor(0.4)).toBe('yellow');
    });

    it('returns red for low grades', () => {
      expect(gradeToColor(0.3)).toBe('red');
      expect(gradeToColor(0.0)).toBe('red');
    });

    it('returns gray for null', () => {
      expect(gradeToColor(null)).toBe('gray');
    });
  });

  describe('formatGrade', () => {
    it('formats as percentage', () => {
      expect(formatGrade(0.75)).toBe('75%');
      expect(formatGrade(1.0)).toBe('100%');
      expect(formatGrade(0.0)).toBe('0%');
    });
  });

  describe('formatTokens', () => {
    it('formats small numbers without suffix', () => {
      expect(formatTokens(100, 50)).toBe('100 | 50');
    });

    it('formats large numbers with k suffix', () => {
      expect(formatTokens(1000, 500)).toBe('1.0k | 500');
      expect(formatTokens(2500, 1000)).toBe('2.5k | 1.0k');
    });
  });

  describe('formatCost', () => {
    it('formats as currency', () => {
      expect(formatCost(0.0123)).toBe('$0.0123');
      expect(formatCost(1.5)).toBe('$1.5000');
    });
  });

  describe('formatLatency', () => {
    it('formats milliseconds below 1000', () => {
      expect(formatLatency(500)).toBe('500ms');
      expect(formatLatency(100)).toBe('100ms');
    });

    it('formats milliseconds for values 1000+', () => {
      expect(formatLatency(1500)).toBe('1500ms');
      expect(formatLatency(2000)).toBe('2000ms');
      expect(formatLatency(1234.567)).toBe('1235ms');
    });
  });

  describe('truncate', () => {
    it('returns text unchanged if under limit', () => {
      const text = 'Hello world';
      expect(truncate(text, 20)).toBe(text);
    });

    it('truncates and adds ellipsis', () => {
      const text = 'This is a very long text that should be truncated';
      const result = truncate(text, 20);
      expect(result).toBe('This is a very long ...');
      expect(result.length).toBe(23);
    });
  });

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

    it('allows valid generator with matching dataset columns', () => {
      const prompt = mockPrompt('Hello {{name}}, you are {{age}} years old');
      const dataset = mockDataset(['name', 'age', 'email']);
      const errors = validateRun(prompt, dataset, null);
      expect(errors).toEqual([]);
    });

    it('blocks generator with missing dataset columns', () => {
      const prompt = mockPrompt('Hello {{name}}, you are {{age}} years old');
      const dataset = mockDataset(['name', 'email']);
      const errors = validateRun(prompt, dataset, null);
      expect(errors).toContain('Generator is missing dataset columns: "age"');
    });

    it('blocks generator with variables when no dataset selected', () => {
      const prompt = mockPrompt('Hello {{name}}');
      const errors = validateRun(prompt, null, null);
      expect(errors).toContain('Generator requires variables but no dataset selected');
    });

    it('allows generator with no variables and no dataset', () => {
      const prompt = mockPrompt('Hello world, no variables here');
      const errors = validateRun(prompt, null, null);
      expect(errors).toEqual([]);
    });

    it('allows grader with {{output}} placeholder', () => {
      const generator = mockPrompt('Response: {{text}}');
      const grader = mockPrompt('Grade: {{output}}', 'grader');
      const dataset = mockDataset(['text']);
      const errors = validateRun(generator, dataset, grader);
      expect(errors).toEqual([]);
    });

    it('blocks grader with missing variables', () => {
      const generator = mockPrompt('Response: {{text}}');
      const grader = mockPrompt('Grade: {{output}} and {{missing_var}}', 'grader');
      const dataset = mockDataset(['text']);
      const errors = validateRun(generator, dataset, grader);
      expect(errors).toContain('Grader is missing variables: "missing_var"');
    });
  });

  describe('parseCSV', () => {
    it('parses basic CSV', () => {
      const csv = 'name,age\nJohn,30\nJane,25';
      const result = parseCSV(csv);
      expect(result.headers).toEqual(['name', 'age']);
      expect(result.rowCount).toBe(2);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({ name: 'John', age: '30' });
    });

    it('trims whitespace', () => {
      const csv = ' name , age \n John , 30 ';
      const result = parseCSV(csv);
      expect(result.headers).toEqual(['name', 'age']);
      expect(result.rows[0]).toEqual({ name: 'John', age: '30' });
    });

    it('caps rows at 50', () => {
      const rows = Array.from({ length: 100 }, (_, i) => `row${i},val${i}`).join('\n');
      const csv = 'id,value\n' + rows;
      const result = parseCSV(csv);
      expect(result.rowCount).toBe(100);
      expect(result.rows).toHaveLength(50);
    });
  });

  describe('parseJSON', () => {
    it('parses JSON array', () => {
      const json = JSON.stringify([
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ]);
      const result = parseJSON(json);
      expect(result.headers).toContain('name');
      expect(result.headers).toContain('age');
      expect(result.rowCount).toBe(2);
      expect(result.rows[0]).toEqual({ name: 'John', age: '30' });
    });

    it('converts values to strings', () => {
      const json = JSON.stringify([{ id: 1, active: true }]);
      const result = parseJSON(json);
      expect(result.rows[0]).toEqual({ id: '1', active: 'true' });
    });

    it('caps rows at 50', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      const json = JSON.stringify(data);
      const result = parseJSON(json);
      expect(result.rowCount).toBe(100);
      expect(result.rows).toHaveLength(50);
    });

    it('throws on non-array JSON', () => {
      const json = JSON.stringify({ name: 'John' });
      expect(() => parseJSON(json)).toThrow('array');
    });

    it('throws on empty array', () => {
      const json = JSON.stringify([]);
      expect(() => parseJSON(json)).toThrow('empty');
    });
  });

  describe('parseDatasetFile', () => {
    it('parses CSV files', () => {
      const csv = 'name,age\nJohn,30';
      const result = parseDatasetFile(csv, 'data.csv');
      expect(result.headers).toEqual(['name', 'age']);
      expect(result.rows).toHaveLength(1);
    });

    it('parses JSON files', () => {
      const json = JSON.stringify([{ name: 'John', age: 30 }]);
      const result = parseDatasetFile(json, 'data.json');
      expect(result.headers).toEqual(['name', 'age']);
      expect(result.rows).toHaveLength(1);
    });

    it('throws on unsupported format', () => {
      expect(() => parseDatasetFile('data', 'data.txt')).toThrow('Unsupported');
    });
  });
});
