// ABOUTME: Simple CSV parsing utility for dataset upload
// ABOUTME: Handles both CSV and JSON formats; cap rows at 50 for preview

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
