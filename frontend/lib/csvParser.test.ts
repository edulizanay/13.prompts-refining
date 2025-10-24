// ABOUTME: Unit tests for CSV/JSON parsing utilities
// ABOUTME: Tests CSV parsing, JSON parsing, and file format detection

import { parseCSV, parseJSON, parseDatasetFile } from './csvParser';

describe('csvParser', () => {
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

    it('handles whitespace-only CSV', () => {
      const result = parseCSV('');
      expect(result.headers.length).toBeGreaterThan(0);
    });

    it('handles single comma header', () => {
      const result = parseCSV(',');
      expect(result.headers).toEqual(['', '']);
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
    it('detects and parses CSV', () => {
      const csv = 'name,age\nJohn,30';
      const result = parseDatasetFile(csv, 'data.csv');
      expect(result.headers).toEqual(['name', 'age']);
    });

    it('detects and parses JSON', () => {
      const json = JSON.stringify([{ name: 'John', age: 30 }]);
      const result = parseDatasetFile(json, 'data.json');
      expect(result.headers).toContain('name');
    });

    it('throws on unsupported format', () => {
      expect(() => parseDatasetFile('text', 'data.txt')).toThrow('format');
    });
  });
});
