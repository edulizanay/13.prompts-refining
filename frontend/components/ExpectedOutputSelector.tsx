// ABOUTME: Dropdown to select expected output format (none, response, json)
// ABOUTME: Shows helper text explaining impact on parsing and grading

'use client';

import { ExpectedOutput } from '@/lib/types';

interface ExpectedOutputSelectorProps {
  value: ExpectedOutput;
  onChange: (value: ExpectedOutput) => void;
}

export function ExpectedOutputSelector({ value, onChange }: ExpectedOutputSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Expected Output</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ExpectedOutput)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
      >
        <option value="none">None</option>
        <option value="response">Response (&lt;response&gt; tags)</option>
        <option value="json">JSON</option>
      </select>
      <p className="text-xs text-gray-500">
        If set and parse fails, cell is marked <span className="font-medium">Malformed</span> and fails in Grade view.
      </p>
    </div>
  );
}
