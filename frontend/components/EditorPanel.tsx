// ABOUTME: Left panel - prompt editing, expected output configuration
// ABOUTME: Handles prompt selection, editing, grader selection, and model management

'use client';

import { useState, useEffect, useRef, useImperativeHandle, useCallback, forwardRef } from 'react';
import { MoreHorizontalIcon, PlusIcon } from 'lucide-react';
import { Prompt } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { extractPlaceholders } from '@/lib/utils';
import {
  getAllPrompts,
  getPromptById,
  createPrompt,
  updatePrompt,
  renamePrompt,
} from '@/lib/services/prompts.client';
import { getDatasetById } from '@/lib/services/datasets.client';
import { createRun } from '@/lib/mockRepo.temp';
import { validateRun } from '@/lib/utils';
import { executeRun } from '@/lib/mockRunExecutor.temp';
import { DatasetSelector } from './DatasetSelector';
import { Modal } from '@/components/ui/modal';
import { PromptEditor } from './PromptEditor';

interface EditorPanelProps {
  onPromptSelected?: (prompt: Prompt) => void;
  selectedDatasetId?: string | null;
  onDatasetSelected?: (datasetId: string | null) => void;
  selectedGraderId?: string | null;
  selectedModelIds?: string[];
  activeRunId?: string | null;
  onActiveRunIdChange?: (runId: string | null) => void;
  onEditorFocus?: () => void;
  onEditorBlur?: () => void;
  onRunClick?: () => void;
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
    selectedModelIds: propModelIds,
    activeRunId: propActiveRunId,
    onActiveRunIdChange,
    onEditorFocus,
    onEditorBlur,
    onRunClick,
  }, ref) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [localDatasetId, setLocalDatasetId] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isRenamingPrompt, setIsRenamingPrompt] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [newPromptDialog, setNewPromptDialog] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptType, setNewPromptType] = useState<'generator' | 'grader'>('generator');
  const [isRunning, setIsRunning] = useState(false);
  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const textIsChangedRef = useRef(false);
  const previousSelectedIdRef = useRef<string>('');

  // Use prop values if provided, otherwise use local state
  const selectedDatasetId = propDatasetId !== undefined ? propDatasetId : localDatasetId;
  const selectedGraderId = propGraderId !== undefined ? propGraderId : null;
  const selectedModelIds = propModelIds || [];
  const activeRunId = propActiveRunId !== undefined ? propActiveRunId : null;

  // Sync with props
  const handleDatasetSelected = (id: string | null) => {
    setLocalDatasetId(id);
    onDatasetSelected?.(id);
  };

  // Load prompts on mount
  useEffect(() => {
    async function loadPrompts() {
      try {
        const all = await getAllPrompts();
        setPrompts(all);
        if (all.length > 0) {
          const toSelect = all[0].id;
          setSelectedId(toSelect);
          const prompt = await getPromptById(toSelect);
          if (prompt) {
            setCurrentPrompt(prompt);
            setRenameInput(prompt.name);
          }
        }
      } catch (error) {
        console.error('[EditorPanel] Failed to load prompts:', error);
      } finally {
        setMounted(true);
      }
    }
    loadPrompts();
  }, []);

  const handleUpdateText = (text: string) => {
    if (!currentPrompt) return;
    setCurrentPrompt({ ...currentPrompt, text });
    textIsChangedRef.current = true;
  };

  const saveIfChanged = useCallback(async () => {
    if (!currentPrompt || !textIsChangedRef.current) return;
    console.log('[EditorPanel] Saving prompt changes:', currentPrompt.id);
    try {
      const updated = await updatePrompt(currentPrompt.id, { text: currentPrompt.text });
      setCurrentPrompt(updated);
      const all = await getAllPrompts();
      setPrompts(all);
      console.log('[EditorPanel] Save successful');
      textIsChangedRef.current = false;
    } catch (error) {
      console.error('[EditorPanel] Save failed:', error);
    }
  }, [currentPrompt]);

  // Sync currentPrompt when selectedId changes
  useEffect(() => {
    async function handlePromptChange() {
      if (selectedId && selectedId !== previousSelectedIdRef.current) {
        // Save current prompt before switching (only if we had a previous prompt)
        if (previousSelectedIdRef.current && textIsChangedRef.current && currentPrompt) {
          console.log('[EditorPanel] Saving prompt changes before switching:', currentPrompt.id);
          try {
            await updatePrompt(currentPrompt.id, { text: currentPrompt.text });
            const all = await getAllPrompts();
            setPrompts(all);
            console.log('[EditorPanel] Save successful');
            textIsChangedRef.current = false;
          } catch (error) {
            console.error('[EditorPanel] Save failed:', error);
          }
        }

        // Load new prompt
        try {
          const prompt = await getPromptById(selectedId);
          if (prompt) {
            setCurrentPrompt(prompt);
            setRenameInput(prompt.name);
            onPromptSelected?.(prompt);
          }
        } catch (error) {
          console.error('[EditorPanel] Failed to load prompt:', error);
        }

        previousSelectedIdRef.current = selectedId;
      }
    }
    handlePromptChange();
  }, [selectedId, onPromptSelected, currentPrompt]);

  const handleEditorBlur = () => {
    saveIfChanged();
    onEditorBlur?.();
  };

  const handleRenamePrompt = async () => {
    if (!currentPrompt || !renameInput.trim()) return;
    try {
      const updated = await renamePrompt(currentPrompt.id, renameInput.trim());
      setCurrentPrompt(updated);
      const all = await getAllPrompts();
      setPrompts(all);
    } catch (error) {
      console.error('[EditorPanel] Rename failed:', error);
    } finally {
      setIsRenamingPrompt(false);
    }
  };

  const handleCreatePrompt = async () => {
    if (!newPromptName.trim()) return;
    try {
      const newPrompt = await createPrompt(newPromptName.trim(), newPromptType);
      const all = await getAllPrompts();
      setPrompts(all);
      setSelectedId(newPrompt.id);
      setNewPromptName('');
      setNewPromptType('generator');
      setNewPromptDialog(false);
    } catch (error) {
      console.error('[EditorPanel] Create failed:', error);
      setErrorDialog('Failed to create prompt');
    }
  };

  const handleRun = useCallback(async () => {
    if (!currentPrompt || activeRunId) return;

    // Save any unsaved changes before running
    await saveIfChanged();

    // Validate
    const dataset = selectedDatasetId ? await getDatasetById(selectedDatasetId) : null;
    const grader = selectedGraderId ? await getPromptById(selectedGraderId) : null;
    const errors = validateRun(currentPrompt, dataset, grader);

    if (errors.length > 0) {
      setErrorDialog(errors[0]);
      return;
    }

    // Check if models selected
    if (selectedModelIds.length === 0) {
      setErrorDialog('Please select at least one model');
      return;
    }

    // Notify parent that run is about to start
    onRunClick?.();

    try {
      setIsRunning(true);

      // Create run
      const versionLabel = `${currentPrompt.type === 'generator' ? 'Generator' : 'Grader'} ${currentPrompt.version_counter}`;
      const run = createRun(currentPrompt.id, versionLabel, selectedModelIds, selectedDatasetId, selectedGraderId);
      onActiveRunIdChange?.(run.id);

      // Reset change tracking after run starts
      textIsChangedRef.current = false;

      // Execute run
      await executeRun(run, dataset, () => {
        // Cell update callback
      }, () => {
        setIsRunning(false);
        onActiveRunIdChange?.(null);
      });
    } catch (error) {
      console.error('Run error:', error);
      setErrorDialog('Run failed');
      setIsRunning(false);
      onActiveRunIdChange?.(null);
    }
  }, [currentPrompt, activeRunId, selectedDatasetId, selectedGraderId, selectedModelIds, onActiveRunIdChange, onRunClick, saveIfChanged]);

  // Expose triggerRun via ref for keyboard shortcuts
  useImperativeHandle(ref, () => ({
    triggerRun: handleRun,
  }), [handleRun]);

  const placeholders = currentPrompt ? extractPlaceholders(currentPrompt.text) : [];

  if (!mounted || !currentPrompt) {
    return <div className="text-neutral-500">Loading editor...</div>;
  }

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-8">
      {/* Prompt Modal */}
      <Modal
        isOpen={newPromptDialog}
        onClose={() => setNewPromptDialog(false)}
        size="small"
        hasBackdropClose={true}
        hasEscapeClose={true}
        className="p-6 space-y-4"
      >
        <h3 className="text-lg font-semibold text-neutral-900">Create New Prompt</h3>
        <input
          autoFocus
          type="text"
          placeholder="Prompt name"
          value={newPromptName}
          onChange={(e) => setNewPromptName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreatePrompt();
          }}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        />
        <select
          value={newPromptType}
          onChange={(e) => setNewPromptType(e.target.value as 'generator' | 'grader')}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        >
          <option value="generator">Generator</option>
          <option value="grader">Grader</option>
        </select>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setNewPromptDialog(false)}
            className="px-4 py-2 text-neutral-700 border border-neutral-300 rounded-md hover:bg-neutral-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreatePrompt}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-opacity-90 text-sm font-medium"
          >
            Create
          </button>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={errorDialog !== null}
        onClose={() => setErrorDialog(null)}
        size="small"
        className="p-6 space-y-4"
      >
        <h3 className="text-lg font-semibold text-error-600">Error</h3>
        <p className="text-sm text-neutral-700">{errorDialog}</p>
        <div className="flex justify-end">
          <button
            onClick={() => setErrorDialog(null)}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-opacity-90 text-sm font-medium"
          >
            OK
          </button>
        </div>
      </Modal>

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
              className="flex-1 px-2 py-1 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          ) : (
            <h2
              onClick={() => setIsRenamingPrompt(true)}
              className="flex-1 text-2xl font-bold text-neutral-900 cursor-pointer hover:text-purple-500 transition-colors"
              title="Click to rename"
            >
              {currentPrompt.name}
            </h2>
          )}

          {/* Prompt Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-md bg-transparent hover:bg-neutral-100 transition-colors" aria-label="Prompt menu">
                <MoreHorizontalIcon size={20} className="text-neutral-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="text-xs uppercase text-neutral-500">Create</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setNewPromptDialog(true)}>
                <PlusIcon size={16} className="mr-2" />
                <span>New Prompt</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-xs uppercase text-neutral-500">Prompts</DropdownMenuLabel>
              {prompts.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => setSelectedId(p.id)}>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-neutral-500">{p.type === 'generator' ? 'Generator' : 'Grader'}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Prompt Editor */}
      <div className="relative px-0.5">
        <PromptEditor
          value={currentPrompt.text}
          onChange={handleUpdateText}
          placeholder={ONBOARDING_PLACEHOLDER}
          onFocus={onEditorFocus}
          onBlur={handleEditorBlur}
        />
        {/* Run Button Overlay */}
        <div className="absolute bottom-4 right-4">
          <Button
            onClick={handleRun}
            disabled={isRunning || !!activeRunId || !currentPrompt || selectedModelIds.length === 0}
            size="small"
            className="min-w-[80px] min-h-[32px]"
          >
            {(isRunning || activeRunId) ? (
              <>
                <Spinner />
                Loading
              </>
            ) : (
              'Run'
            )}
          </Button>
        </div>
      </div>

      {/* Variables */}
      {placeholders.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">Variables</label>
          <div className="flex flex-wrap gap-2">
            {placeholders.map((p) => (
              <span
                key={p}
                className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700"
              >
                {`{{${p}}}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Dataset Selector */}
      <DatasetSelector selectedDatasetId={selectedDatasetId} onDatasetSelected={handleDatasetSelected} />
    </div>
  );
  }
);
