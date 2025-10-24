// ABOUTME: Left panel orchestrator - manages prompt state and wires all editor subcomponents
// ABOUTME: Handles: selection, editing, renaming, expected output changes

'use client';

import { useState, useEffect } from 'react';
import { Prompt } from '@/lib/types';
import { PromptHeader } from './PromptHeader';
import { PromptEditor } from './PromptEditor';
import { PromptSelector } from './PromptSelector';
import { ExpectedOutputSelector } from './ExpectedOutputSelector';
import {
  getAllPrompts,
  getPromptById,
  createPrompt,
  updatePrompt,
  renamePrompt,
} from '@/lib/mockRepo.temp';

interface EditorPanelProps {
  onPromptSelected?: (prompt: Prompt) => void;
}

export function EditorPanel({ onPromptSelected }: EditorPanelProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load prompts on mount
  useEffect(() => {
    const all = getAllPrompts();
    setPrompts(all);
    if (all.length > 0) {
      const toSelect = all[0].id;
      setSelectedId(toSelect);
      const prompt = getPromptById(toSelect);
      if (prompt) setCurrentPrompt(prompt);
    }
    setMounted(true);
  }, []);

  // Sync currentPrompt when selectedId changes
  useEffect(() => {
    if (selectedId) {
      const prompt = getPromptById(selectedId);
      if (prompt) {
        setCurrentPrompt(prompt);
        onPromptSelected?.(prompt);
      }
    }
  }, [selectedId, onPromptSelected]);

  const handleSelectPrompt = (id: string) => {
    setSelectedId(id);
  };

  const handleCreatePrompt = (name: string, type: 'generator' | 'grader') => {
    const newPrompt = createPrompt(name, type);
    setPrompts([...getAllPrompts()]);
    setSelectedId(newPrompt.id);
  };

  const handleUpdateText = (text: string) => {
    if (!currentPrompt) return;
    const updated = updatePrompt(currentPrompt.id, { text });
    if (updated) {
      setCurrentPrompt(updated);
      setPrompts(getAllPrompts());
    }
  };

  const handleUpdateExpectedOutput = (expectedOutput: 'none' | 'response' | 'json') => {
    if (!currentPrompt) return;
    const updated = updatePrompt(currentPrompt.id, { expected_output: expectedOutput });
    if (updated) {
      setCurrentPrompt(updated);
      setPrompts(getAllPrompts());
    }
  };

  const handleRename = (newName: string) => {
    if (!currentPrompt) return;
    const updated = renamePrompt(currentPrompt.id, newName);
    if (updated) {
      setCurrentPrompt(updated);
      setPrompts(getAllPrompts());
    }
  };

  if (!mounted || !currentPrompt) {
    return <div className="text-gray-500">Loading editor...</div>;
  }

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-8">
      <PromptSelector prompts={prompts} selectedId={selectedId} onSelect={handleSelectPrompt} onCreate={handleCreatePrompt} />

      <PromptHeader prompt={currentPrompt} onRename={handleRename} />

      <PromptEditor text={currentPrompt.text} onChange={handleUpdateText} />

      <ExpectedOutputSelector value={currentPrompt.expected_output} onChange={handleUpdateExpectedOutput} />
    </div>
  );
}
