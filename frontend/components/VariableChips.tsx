// ABOUTME: Displays placeholder variables as read-only chips
// ABOUTME: Generator vars gray; Grader vars purple; shows detected {{variables}}

'use client';

import { extractPlaceholders } from '@/lib/utils';

interface VariableChipsProps {
  text: string;
  type?: 'generator' | 'grader';
  label?: string;
}

export function VariableChips({ text, type = 'generator', label }: VariableChipsProps) {
  const placeholders = extractPlaceholders(text);

  if (placeholders.length === 0) {
    return null;
  }

  const bgColor = type === 'generator' ? 'bg-gray-100' : 'bg-purple-100';
  const textColor = type === 'generator' ? 'text-gray-700' : 'text-purple-700';

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {placeholders.map((p) => (
          <span key={p} className={`px-2 py-1 rounded text-xs font-medium ${bgColor} ${textColor}`}>
            {`{{${p}}}`}
          </span>
        ))}
      </div>
    </div>
  );
}
