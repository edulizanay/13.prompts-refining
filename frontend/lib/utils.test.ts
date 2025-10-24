// ABOUTME: Unit tests for utility functions (extraction, parsing, formatting)
// ABOUTME: Tests placeholder detection, output parsing, grade normalization, and formatting

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
} from './utils';

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

    it('formats seconds for 1000+ms', () => {
      expect(formatLatency(1500)).toBe('1.5s');
      expect(formatLatency(2000)).toBe('2.0s');
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
});
