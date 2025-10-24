// ABOUTME: Displays prompt name with inline rename, type badge, and version label
// ABOUTME: Type: generator (blue) | grader (purple); Version shows on label

'use client';

import { useState } from 'react';
import { Prompt } from '@/lib/types';

interface PromptHeaderProps {
  prompt: Prompt;
  onRename: (newName: string) => void;
}

export function PromptHeader({ prompt, onRename }: PromptHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(prompt.name);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setNameInput(prompt.name);
    }
  };

  const handleSave = () => {
    if (nameInput.trim() && nameInput !== prompt.name) {
      onRename(nameInput.trim());
    } else {
      setNameInput(prompt.name);
    }
    setIsEditing(false);
  };

  const typeColor = prompt.type === 'generator' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  const typeLabel = prompt.type === 'generator' ? 'Generator' : 'Grader';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {isEditing ? (
          <input
            autoFocus
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          />
        ) : (
          <h2
            onClick={() => setIsEditing(true)}
            className="flex-1 text-2xl font-bold text-gray-900 cursor-pointer hover:text-primary transition-colors"
            title="Click to rename"
          >
            {prompt.name}
          </h2>
        )}
        <span className={`px-2 py-1 rounded text-sm font-medium ${typeColor}`}>{typeLabel}</span>
      </div>
      <div className="text-sm text-gray-500">
        {typeLabel} {prompt.version_counter}
      </div>
    </div>
  );
}
