// ABOUTME: Left panel - prompt editing, expected output configuration
// ABOUTME: Handles prompt selection, editing, grader selection, and model management

'use client';

import { useState, useEffect, useRef, useImperativeHandle, useCallback, forwardRef } from 'react';
import { Prompt } from '@/lib/types';
import { extractPlaceholders } from '@/lib/utils';
import {
  getAllPrompts,
  getPromptById,
  createPrompt,
  updatePrompt,
  renamePrompt,
  getDatasetById,
  createRun,
} from '@/lib/mockRepo.temp';
import { validateRun } from '@/lib/utils';
import { executeRun } from '@/lib/mockRunExecutor.temp';
import { ModelManager } from './ModelManager';
import { DatasetSelector } from './DatasetSelector';

interface EditorPanelProps {
  onPromptSelected?: (prompt: Prompt) => void;
  selectedDatasetId?: string | null;
  onDatasetSelected?: (datasetId: string | null) => void;
  selectedGraderId?: string | null;
  onGraderSelected?: (graderId: string | null) => void;
  selectedModelIds?: string[];
  onModelsChange?: (modelIds: string[]) => void;
  activeRunId?: string | null;
  onActiveRunIdChange?: (runId: string | null) => void;
}

const ONBOARDING_PLACEHOLDER = `Write your prompt here. Use {{variables}} for dynamic inputs.

Example:
You are a helpful assistant. The user asks: {{user_message}}
Respond professionally.`;

export const EditorPanel = forwardRef<{ triggerRun: () => Promise<void> }, EditorPanelProps>(
  function EditorPanel({
    onPromptSelected,
    selectedDatasetId: propDatasetId,
    onDatasetSelected,
    selectedGraderId: propGraderId,
    onGraderSelected,
    selectedModelIds: propModelIds,
    onModelsChange,
    activeRunId: propActiveRunId,
    onActiveRunIdChange,
  }, ref) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [localDatasetId, setLocalDatasetId] = useState<string | null>(null);
  const [localGraderId, setLocalGraderId] = useState<string | null>(null);
  const [localModelIds, setLocalModelIds] = useState<string[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isRenamingPrompt, setIsRenamingPrompt] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [newPromptDialog, setNewPromptDialog] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptType, setNewPromptType] = useState<'generator' | 'grader'>('generator');
  const [isRunning, setIsRunning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textIsChangedRef = useRef(false);

  // Use prop values if provided, otherwise use local state
  const selectedDatasetId = propDatasetId !== undefined ? propDatasetId : localDatasetId;
  const selectedGraderId = propGraderId !== undefined ? propGraderId : localGraderId;
  const selectedModelIds = propModelIds !== undefined ? propModelIds : localModelIds;
  const activeRunId = propActiveRunId !== undefined ? propActiveRunId : null;

  // Sync with props
  const handleDatasetSelected = (id: string | null) => {
    setLocalDatasetId(id);
    onDatasetSelected?.(id);
  };

  const handleGraderSelected = (id: string | null) => {
    setLocalGraderId(id);
    onGraderSelected?.(id);
  };

  const handleModelsChange = (ids: string[]) => {
    setLocalModelIds(ids);
    onModelsChange?.(ids);
  };

  // Load prompts on mount
  useEffect(() => {
    const all = getAllPrompts();
    setPrompts(all);
    if (all.length > 0) {
      const toSelect = all[0].id;
      setSelectedId(toSelect);
      const prompt = getPromptById(toSelect);
      if (prompt) {
        setCurrentPrompt(prompt);
        setRenameInput(prompt.name);
      }
    }
    setMounted(true);
  }, []);

  // Sync currentPrompt when selectedId changes
  useEffect(() => {
    if (selectedId) {
      const prompt = getPromptById(selectedId);
      if (prompt) {
        setCurrentPrompt(prompt);
        setRenameInput(prompt.name);
        onPromptSelected?.(prompt);
      }
    }
  }, [selectedId, onPromptSelected]);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [currentPrompt?.text]);

  const handleUpdateText = (text: string) => {
    if (!currentPrompt) return;
    const updated = updatePrompt(currentPrompt.id, { text });
    if (updated) {
      setCurrentPrompt(updated);
      setPrompts(getAllPrompts());
      textIsChangedRef.current = true;
    }
  };

  const handleRenamePrompt = () => {
    if (!currentPrompt || !renameInput.trim()) return;
    const updated = renamePrompt(currentPrompt.id, renameInput.trim());
    if (updated) {
      setCurrentPrompt(updated);
      setPrompts(getAllPrompts());
    }
    setIsRenamingPrompt(false);
  };

  const handleCreatePrompt = () => {
    if (!newPromptName.trim()) return;
    const newPrompt = createPrompt(newPromptName.trim(), newPromptType);
    setPrompts([...getAllPrompts()]);
    setSelectedId(newPrompt.id);
    setNewPromptName('');
    setNewPromptType('generator');
    setNewPromptDialog(false);
  };

  const handleUpdateExpectedOutput = (expectedOutput: 'none' | 'response' | 'json') => {
    if (!currentPrompt) return;
    const updated = updatePrompt(currentPrompt.id, { expected_output: expectedOutput });
    if (updated) {
      setCurrentPrompt(updated);
      setPrompts(getAllPrompts());
    }
  };

  const handleRun = useCallback(async () => {
    if (!currentPrompt || activeRunId) return;

    // Validate
    const dataset = selectedDatasetId ? getDatasetById(selectedDatasetId) : null;
    const grader = selectedGraderId ? getPromptById(selectedGraderId) : null;
    const errors = validateRun(currentPrompt, dataset, grader);

    if (errors.length > 0) {
      // Show first error in alert for now (will be replaced with toast in UX polish)
      alert(errors[0]);
      return;
    }

    // Check if models selected
    if (selectedModelIds.length === 0) {
      alert('Please select at least one model');
      return;
    }

    try {
      setIsRunning(true);

      // Increment version counter only if text was edited since last run
      let updatedPrompt = currentPrompt;
      if (textIsChangedRef.current) {
        updatedPrompt = updatePrompt(currentPrompt.id, {
          version_counter: currentPrompt.version_counter + 1,
        }) || currentPrompt;
        if (!updatedPrompt) {
          alert('Failed to update prompt');
          return;
        }
        setCurrentPrompt(updatedPrompt);
        textIsChangedRef.current = false;
      }

      // Create run
      const versionLabel = `${currentPrompt.type === 'generator' ? 'Generator' : 'Grader'} ${updatedPrompt.version_counter}`;
      const run = createRun(currentPrompt.id, versionLabel, selectedModelIds, selectedDatasetId, selectedGraderId);
      onActiveRunIdChange?.(run.id);

      // Execute run
      await executeRun(run, dataset, () => {
        // Cell update callback
      }, () => {
        setIsRunning(false);
        onActiveRunIdChange?.(null);
      });
    } catch (error) {
      console.error('Run error:', error);
      alert('Run failed');
      setIsRunning(false);
      onActiveRunIdChange?.(null);
    }
  }, [currentPrompt, activeRunId, selectedDatasetId, selectedGraderId, selectedModelIds, onActiveRunIdChange]);

  // Expose triggerRun via ref for keyboard shortcuts
  useImperativeHandle(ref, () => ({
    triggerRun: handleRun,
  }), [handleRun]);

  const placeholders = currentPrompt ? extractPlaceholders(currentPrompt.text) : [];

  if (!mounted || !currentPrompt) {
    return <div className="text-gray-500">Loading editor...</div>;
  }

  const typeColor = currentPrompt.type === 'generator' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  const typeLabel = currentPrompt.type === 'generator' ? 'Generator' : 'Grader';

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-8">
      {/* Prompt Selector */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            {prompts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.type})
              </option>
            ))}
          </select>
          <button
            onClick={() => setNewPromptDialog(true)}
            className="px-3 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 text-sm font-medium"
          >
            New
          </button>
        </div>

        {newPromptDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-lg space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Prompt</h3>
              <input
                autoFocus
                type="text"
                placeholder="Prompt name"
                value={newPromptName}
                onChange={(e) => setNewPromptName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreatePrompt();
                  if (e.key === 'Escape') setNewPromptDialog(false);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <select
                value={newPromptType}
                onChange={(e) => setNewPromptType(e.target.value as 'generator' | 'grader')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="generator">Generator</option>
                <option value="grader">Grader</option>
              </select>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setNewPromptDialog(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePrompt}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 text-sm font-medium"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prompt Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {isRenamingPrompt ? (
            <input
              autoFocus
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              onBlur={handleRenamePrompt}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenamePrompt();
                if (e.key === 'Escape') {
                  setIsRenamingPrompt(false);
                  setRenameInput(currentPrompt.name);
                }
              }}
              className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
          ) : (
            <h2
              onClick={() => setIsRenamingPrompt(true)}
              className="flex-1 text-2xl font-bold text-gray-900 cursor-pointer hover:text-primary transition-colors"
              title="Click to rename"
            >
              {currentPrompt.name}
            </h2>
          )}
          <span className={`px-2 py-1 rounded text-sm font-medium ${typeColor}`}>{typeLabel}</span>
        </div>
        <div className="text-sm text-gray-500">
          {typeLabel} {currentPrompt.version_counter}
        </div>
      </div>

      {/* Prompt Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Prompt</label>
          {textIsChangedRef.current && <span className="text-xs text-blue-500 font-medium">Saving...</span>}
        </div>
        <textarea
          ref={textareaRef}
          value={currentPrompt.text}
          onChange={(e) => handleUpdateText(e.target.value)}
          placeholder={ONBOARDING_PLACEHOLDER}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none min-h-[300px]"
        />
      </div>

      {/* Variables */}
      {placeholders.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Variables</label>
          <div className="flex flex-wrap gap-2">
            {placeholders.map((p) => (
              <span
                key={p}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  currentPrompt.type === 'generator' ? 'bg-gray-100 text-gray-700' : 'bg-purple-100 text-purple-700'
                }`}
              >
                {`{{${p}}}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expected Output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Expected Output</label>
          <div className="flex gap-2">
            {(['none', 'response', 'json'] as const).map((option) => (
              <button
                key={option}
                onClick={() => handleUpdateExpectedOutput(option)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  currentPrompt.expected_output === option
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {option === 'none' ? 'None' : option === 'response' ? 'Response' : 'JSON'}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-500">
          If set and parse fails, cell is marked <span className="font-medium">Malformed</span> and fails in Grade view.
        </p>
      </div>

      {/* Grader Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Grader (Optional)</label>
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={() => handleGraderSelected(null)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                !selectedGraderId
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            >
              None
            </button>
            {prompts
              .filter((p) => p.type === 'grader')
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleGraderSelected(p.id)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    selectedGraderId === p.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {p.name}
                </button>
              ))}
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Grader runs after each generation and may use {`{{output}}`} placeholder.
        </p>

        {selectedGraderId && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-purple-700">Grader Variables:</div>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const grader = prompts.find((p) => p.id === selectedGraderId);
                return grader ? (
                  extractPlaceholders(grader.text).map((v) => (
                    <span key={v} className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                      {`{{${v}}}`}
                    </span>
                  ))
                ) : null;
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Dataset Selector */}
      <DatasetSelector selectedDatasetId={selectedDatasetId} onDatasetSelected={handleDatasetSelected} />

      {/* Model Manager */}
      <ModelManager selectedModelIds={selectedModelIds} onModelsChange={handleModelsChange} />

      {/* Run Button */}
      <div className="mt-8 pt-6 border-t border-accent-dark">
        <button
          onClick={handleRun}
          disabled={(isRunning || activeRunId ? true : false) || !currentPrompt || selectedModelIds.length === 0}
          className={`w-full px-4 py-2 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
            isRunning || activeRunId || !currentPrompt || selectedModelIds.length === 0
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-opacity-90 active:bg-opacity-80'
          }`}
        >
          {isRunning || activeRunId ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Loading…</span>
            </>
          ) : (
            <span>Run</span>
          )}
        </button>
      </div>
    </div>
  );
  }
);
