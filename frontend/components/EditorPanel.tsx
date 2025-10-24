// ABOUTME: Left panel - prompt editing, dataset selection, expected output configuration
// ABOUTME: Consolidates editor, header, selector, variables, dataset management inline

'use client';

import { useState, useEffect, useRef } from 'react';
import { Prompt, Dataset } from '@/lib/types';
import { extractPlaceholders } from '@/lib/utils';
import { parseDatasetFile } from '@/lib/csvParser';
import {
  getAllPrompts,
  getPromptById,
  createPrompt,
  updatePrompt,
  renamePrompt,
  getAllDatasets,
  createDataset,
  getDatasetById,
} from '@/lib/mockRepo.temp';
import { ModelManager } from './ModelManager';

interface EditorPanelProps {
  onPromptSelected?: (prompt: Prompt) => void;
}

const ONBOARDING_PLACEHOLDER = `Write your prompt here. Use {{variables}} for dynamic inputs.

Example:
You are a helpful assistant. The user asks: {{user_message}}
Respond professionally.`;

export function EditorPanel({ onPromptSelected }: EditorPanelProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
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
  const [previewDatasetId, setPreviewDatasetId] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textIsChangedRef = useRef(false);

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

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const text = await file.text();
      const result = parseDatasetFile(text, file.name);
      const datasetName = file.name.replace(/\.(csv|json)$/, '');
      const newDataset = createDataset(datasetName, result.headers, result.rows);
      setDatasets(getAllDatasets());
      setSelectedDatasetId(newDataset.id);
      showToast('success', `Uploaded "${datasetName}" with ${result.rowCount} rows`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse file';
      showToast('error', message);
    } finally {
      setUploadLoading(false);
    }
  };

  const selectedDataset = selectedDatasetId ? datasets.find((d) => d.id === selectedDatasetId) : null;
  const previewDataset = previewDatasetId ? getDatasetById(previewDatasetId) : null;
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
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Dataset</label>
        <select
          value={selectedDatasetId || ''}
          onChange={(e) => setSelectedDatasetId(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        >
          <option value="">No dataset</option>
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.row_count} rows)
            </option>
          ))}
        </select>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json"
          onChange={handleFileSelect}
          disabled={uploadLoading}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadLoading}
          className="w-full px-3 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploadLoading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Uploading...
            </>
          ) : (
            'Upload Dataset (CSV/JSON)'
          )}
        </button>

        {toast && (
          <div
            className={`p-3 rounded-md text-sm ${
              toast.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {toast.message}
          </div>
        )}

        {selectedDataset && (
          <button
            onClick={() => setPreviewDatasetId(selectedDataset.id)}
            className="text-sm text-primary hover:underline"
          >
            Preview ({selectedDataset.row_count} rows)
          </button>
        )}
      </div>

      {/* Model Manager */}
      <ModelManager selectedModelIds={selectedModelIds} onModelsChange={setSelectedModelIds} />

      {/* Dataset Preview Modal */}
      {previewDataset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-h-96 max-w-4xl shadow-lg flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{previewDataset.name} Preview</h3>
              <button
                onClick={() => setPreviewDatasetId(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    {previewDataset.headers.map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-left font-medium text-gray-700 border-b border-gray-200"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewDataset.rows.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {previewDataset.headers.map((h) => (
                        <td key={h} className="px-4 py-2 border-b border-gray-200 text-gray-600">
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2 border-t border-gray-200 text-xs text-gray-500">
              Showing {previewDataset.rows.length} of {previewDataset.row_count} rows
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
