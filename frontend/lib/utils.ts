// ABOUTME: Business logic utilities (extraction, parsing, formatting, validation)
// ABOUTME: Reusable functions for prompt analysis, grade normalization, and string formatting

import { Prompt, Dataset } from './types';

export function extractPlaceholders(text: string): string[] {
  const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
  const matches = text.matchAll(regex);
  const unique = new Set<string>();
  for (const match of matches) {
    unique.add(match[1]);
  }
  return Array.from(unique);
}

export function parseOutput(
  raw: string,
  expected: 'none' | 'response' | 'json'
): { parsed: string | null; isMalformed: boolean } {
  if (expected === 'none') {
    return { parsed: raw, isMalformed: false };
  }

  if (expected === 'response') {
    // Try to extract <response>...</response> tags
    const match = raw.match(/<response>([\s\S]*?)<\/response>/);
    if (match) {
      return { parsed: match[1].trim(), isMalformed: false };
    }
    // Tags not found = malformed
    return { parsed: null, isMalformed: true };
  }

  if (expected === 'json') {
    try {
      const parsed = JSON.parse(raw);
      return { parsed: JSON.stringify(parsed, null, 2), isMalformed: false };
    } catch {
      return { parsed: null, isMalformed: true };
    }
  }

  return { parsed: null, isMalformed: false };
}

export function normalizeGrade(response: string): number {
  const lower = response.toLowerCase().trim();

  if (lower === 'yes') return 1.0;
  if (lower === 'no') return 0.0;

  // Try to parse as number 1-5
  const num = parseFloat(response);
  if (!isNaN(num) && num >= 1 && num <= 5) {
    return (num - 1) / 4; // Map [1,5] to [0,1]
  }

  // Default: treat as fail
  return 0.0;
}

export function gradeToColor(grade: number | null): string {
  if (grade === null) return 'gray';
  if (grade >= 0.7) return 'green';
  if (grade >= 0.4) return 'yellow';
  return 'red';
}

export function formatGrade(grade: number): string {
  return `${Math.round(grade * 100)}%`;
}

export function formatTokens(tokenIn: number, tokenOut: number): string {
  const formatNum = (n: number): string => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return `${n}`;
  };
  return `${formatNum(tokenIn)} | ${formatNum(tokenOut)}`;
}

export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function truncate(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

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

export interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

export function parseCSV(csvText: string): ParseResult {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header
  const headers = lines[0].split(',').map((h) => h.trim());
  if (headers.length === 0) {
    throw new Error('No headers found');
  }

  // Parse rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }

  return {
    headers,
    rows: rows.slice(0, 50), // Cap at 50 for preview
    rowCount: rows.length,
  };
}

export function parseJSON(jsonText: string): ParseResult {
  const data = JSON.parse(jsonText);

  if (!Array.isArray(data)) {
    throw new Error('JSON must be an array of objects');
  }

  if (data.length === 0) {
    throw new Error('JSON array is empty');
  }

  const headers = Object.keys(data[0]);
  const rows = data.map((obj) => {
    const row: Record<string, string> = {};
    headers.forEach((h) => {
      row[h] = String(obj[h] || '');
    });
    return row;
  });

  return {
    headers,
    rows: rows.slice(0, 50), // Cap at 50 for preview
    rowCount: rows.length,
  };
}

export function parseDatasetFile(text: string, fileName: string): ParseResult {
  if (fileName.endsWith('.csv')) {
    return parseCSV(text);
  } else if (fileName.endsWith('.json')) {
    return parseJSON(text);
  } else {
    throw new Error('Unsupported file format. Use CSV or JSON.');
  }
}

// Utility function for conditional class names
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
