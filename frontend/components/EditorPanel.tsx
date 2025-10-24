// ABOUTME: Left panel - prompt editing, expected output configuration
// ABOUTME: Handles prompt selection, editing, grader selection, and model management

'use client';

import { useState, useEffect, useRef } from 'react';
import { Prompt } from '@/lib/types';
import { extractPlaceholders } from '@/lib/utils';
import {
  getAllPrompts,
  getPromptById,
  createPrompt,
  updatePrompt,
  renamePrompt,
} from '@/lib/mockRepo.temp';
import { ModelManager } from './ModelManager';
import { DatasetSelector } from './DatasetSelector';

interface EditorPanelProps {
  onPromptSelected?: (prompt: Prompt) => void;
}

const ONBOARDING_PLACEHOLDER = `Write your prompt here. Use {{variables}} for dynamic inputs.

Example:
You are a helpful assistant. The user asks: {{user_message}}
Respond professionally.`;

export function EditorPanel({ onPromptSelected }: EditorPanelProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [selectedGraderId, setSelectedGraderId] = useState<string | null>(null);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isRenamingPrompt, setIsRenamingPrompt] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [newPromptDialog, setNewPromptDialog] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptType, setNewPromptType] = useState<'generator' | 'grader'>('generator');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textIsChangedRef = useRef(false);

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
    }
    textIsChangedRef.current = true;
    setTimeout(() => {
      textIsChangedRef.current = false;
    }, 500);
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
        <label className="block text-sm font-medium text-gray-700">Expected Output</label>
        <select
          value={currentPrompt.expected_output}
          onChange={(e) => handleUpdateExpectedOutput(e.target.value as 'none' | 'response' | 'json')}
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

      {/* Grader Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Grader (Optional)</label>
        <select
          value={selectedGraderId || ''}
          onChange={(e) => setSelectedGraderId(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        >
          <option value="">No grader</option>
          {prompts
            .filter((p) => p.type === 'grader')
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
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
      <DatasetSelector selectedDatasetId={selectedDatasetId} onDatasetSelected={setSelectedDatasetId} />

      {/* Model Manager */}
      <ModelManager selectedModelIds={selectedModelIds} onModelsChange={setSelectedModelIds} />
    </div>
  );
}
