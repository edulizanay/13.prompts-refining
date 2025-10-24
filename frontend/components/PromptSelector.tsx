// ABOUTME: Dropdown to switch between prompts, includes "New Prompt" dialog
// ABOUTME: Dialog asks for name and type; creates with expected_output='none'

'use client';

import { useState } from 'react';
import { Prompt } from '@/lib/types';

interface PromptSelectorProps {
  prompts: Prompt[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string, type: 'generator' | 'grader') => void;
}

export function PromptSelector({ prompts, selectedId, onSelect, onCreate }: PromptSelectorProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'generator' | 'grader'>('generator');

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName.trim(), newType);
      setNewName('');
      setNewType('generator');
      setShowDialog(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') setShowDialog(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        >
          {prompts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.type})
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowDialog(true)}
          className="px-3 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 text-sm font-medium"
        >
          New
        </button>
      </div>

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Create New Prompt</h3>
            <input
              autoFocus
              type="text"
              placeholder="Prompt name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as 'generator' | 'grader')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="generator">Generator</option>
              <option value="grader">Grader</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 text-sm font-medium"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
