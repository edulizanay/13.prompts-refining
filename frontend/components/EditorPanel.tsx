// ABOUTME: Left panel orchestrator - manages prompt state and wires all editor subcomponents
// ABOUTME: Handles: selection, editing, renaming, expected output, dataset selection

'use client';

import { useState, useEffect } from 'react';
import { Prompt, Dataset } from '@/lib/types';
import { PromptHeader } from './PromptHeader';
import { PromptEditor } from './PromptEditor';
import { PromptSelector } from './PromptSelector';
import { ExpectedOutputSelector } from './ExpectedOutputSelector';
import { VariableChips } from './VariableChips';
import { DatasetSelector } from './DatasetSelector';
import {
  getAllPrompts,
  getPromptById,
  createPrompt,
  updatePrompt,
  renamePrompt,
  getAllDatasets,
  createDataset,
} from '@/lib/mockRepo.temp';

interface EditorPanelProps {
  onPromptSelected?: (prompt: Prompt) => void;
}

export function EditorPanel({ onPromptSelected }: EditorPanelProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load prompts and datasets on mount
  useEffect(() => {
    const all = getAllPrompts();
    const allDatasets = getAllDatasets();
    setPrompts(all);
    setDatasets(allDatasets);
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

  const handleUploadDataset = (
    name: string,
    headers: string[],
    rows: Record<string, string>[]
  ) => {
    const newDataset = createDataset(name, headers, rows);
    setDatasets(getAllDatasets());
    setSelectedDatasetId(newDataset.id);
  };

  if (!mounted || !currentPrompt) {
    return <div className="text-gray-500">Loading editor...</div>;
  }

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-8">
      <PromptSelector prompts={prompts} selectedId={selectedId} onSelect={handleSelectPrompt} onCreate={handleCreatePrompt} />

      <PromptHeader prompt={currentPrompt} onRename={handleRename} />

      <PromptEditor text={currentPrompt.text} onChange={handleUpdateText} />

      <VariableChips text={currentPrompt.text} type={currentPrompt.type} label="Variables" />

      <ExpectedOutputSelector value={currentPrompt.expected_output} onChange={handleUpdateExpectedOutput} />

      <DatasetSelector
        datasets={datasets}
        selectedId={selectedDatasetId}
        onSelect={setSelectedDatasetId}
        onUpload={handleUploadDataset}
      />
    </div>
  );
}
