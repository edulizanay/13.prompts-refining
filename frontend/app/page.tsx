// ABOUTME: Main page - two-panel layout (Editor left, Results right)
// ABOUTME: Wires state management and orchestrates component rendering

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { FileUpIcon, FlaskConicalIcon } from 'lucide-react';
import type { Prompt, Run, Dataset } from '@/lib/types';
import { initializeSeedData, getUIState, setActiveRunId, getRunById, getDatasetById, deduplicateModels, createDataset, getAllPrompts } from '@/lib/mockRepo.temp';
import { parseDatasetFile } from '@/lib/utils';
import { EditorPanel } from '@/components/EditorPanel';
import { ResultsGrid } from '@/components/ResultsGrid';
import { ModelManager } from '@/components/ModelManager';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [selectedGraderId, setSelectedGraderId] = useState<string | null>(null);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [activeRunId, setActiveRunIdState] = useState<string | null>(null);
  const [displayRunId, setDisplayRunId] = useState<string | null>(null);
  const [currentRun, setCurrentRun] = useState<Run | null>(null);
  const [currentDataset, setCurrentDataset] = useState<Dataset | null>(null);
  const [metricView, setMetricView] = useState<'grade' | 'tokens' | 'cost' | 'latency'>('grade');
  const [showParsedOnly] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadToast, setUploadToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const editorPanelRef = useRef<{ triggerRun: () => Promise<void> }>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize seed data on first load
    initializeSeedData();

    // Clean up any duplicate models
    deduplicateModels();

    // Load UI state
    const uiState = getUIState();
    setActiveRunIdState(uiState.activeRunId);
    setDisplayRunId(uiState.activeRunId);

    // Load compact mode preference from localStorage
    const savedCompactMode = localStorage.getItem('isCompactMode');
    if (savedCompactMode !== null) {
      setIsCompactMode(savedCompactMode === 'true');
    }

    // Load prompts
    setPrompts(getAllPrompts());

    setMounted(true);
  }, []);

  // Update global UI state when activeRunId changes
  useEffect(() => {
    setActiveRunId(activeRunId);
  }, [activeRunId]);

  // Track current run and dataset - display the last run that was active
  useEffect(() => {
    if (activeRunId) {
      // When a new run starts, update display run
      setDisplayRunId(activeRunId);
    }
  }, [activeRunId]);

  // Update current run and dataset based on displayRunId (keeps showing results even after execution ends)
  useEffect(() => {
    if (displayRunId) {
      const run = getRunById(displayRunId);
      setCurrentRun(run || null);
      if (run?.dataset_id) {
        const dataset = getDatasetById(run.dataset_id);
        setCurrentDataset(dataset || null);
      } else {
        setCurrentDataset(null);
      }
    }
  }, [displayRunId]);

  // Keyboard shortcut: Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux) to run
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isRunShortcut = isMac ? e.metaKey && e.key === 'Enter' : e.ctrlKey && e.key === 'Enter';

      if (isRunShortcut) {
        e.preventDefault();
        editorPanelRef.current?.triggerRun();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePromptSelected = useCallback((_prompt: Prompt) => {
    // Prompt selection is handled internally by EditorPanel
  }, []);

  const toggleCompactMode = () => {
    const newMode = !isCompactMode;
    setIsCompactMode(newMode);
    localStorage.setItem('isCompactMode', String(newMode));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const text = await file.text();
      const result = parseDatasetFile(text, file.name);
      const dataset = createDataset(file.name.replace(/\.[^.]+$/, ''), result.headers, result.rows);
      setSelectedDatasetId(dataset.id);
      setUploadToast({ type: 'success', message: `Dataset "${dataset.name}" uploaded successfully` });
      setTimeout(() => setUploadToast(null), 3000);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse dataset';
      setUploadToast({ type: 'error', message });
      setTimeout(() => setUploadToast(null), 3000);
    } finally {
      setUploadLoading(false);
    }
  };

  if (!mounted) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 h-screen w-full bg-background flex flex-col">
      <div className="flex h-full gap-6 p-6">
        {/* Left Panel: Editor */}
        <div
          style={{ width: isCompactMode ? '100%' : '40%' }}
          className="overflow-y-auto px-6 transition-all duration-300 ease-in-out"
        >
          <EditorPanel
            ref={editorPanelRef}
            onPromptSelected={handlePromptSelected}
            selectedDatasetId={selectedDatasetId}
            onDatasetSelected={setSelectedDatasetId}
            selectedGraderId={selectedGraderId}
            onGraderSelected={setSelectedGraderId}
            selectedModelIds={selectedModelIds}
            activeRunId={activeRunId}
            onActiveRunIdChange={setActiveRunIdState}
            onToggleCompactMode={toggleCompactMode}
            isCompactMode={isCompactMode}
          />
        </div>

        {/* Right Panel: Results */}
        {!isCompactMode && (
          <div
            style={{ width: '60%' }}
            className="overflow-y-auto flex flex-col px-6 transition-all duration-300 ease-in-out"
          >
            {/* Model Manager */}
            <div className="mb-4">
              <ModelManager selectedModelIds={selectedModelIds} onModelsChange={setSelectedModelIds} />
            </div>

            <div className="space-y-4 flex-1">
              {/* Toolbar container with metric view and upload button */}
              <div className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                <span className="text-xs font-medium text-gray-600">View:</span>
                {(['grade', 'tokens', 'cost', 'latency'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setMetricView(view)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      metricView === view
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}

                {/* Grader Selector Button */}
                <div className="ml-auto flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="px-4 py-2 bg-purple-50 text-primary border border-purple-200 rounded-full hover:bg-purple-100 hover:border-primary transition-all duration-150 text-sm font-medium flex items-center gap-2">
                        {selectedGraderId ? (
                          <span>{prompts.find(p => p.id === selectedGraderId)?.name}</span>
                        ) : (
                          <FlaskConicalIcon size={16} />
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                      <DropdownMenuItem onClick={() => setSelectedGraderId(null)}>
                        No grader
                      </DropdownMenuItem>
                      {prompts
                        .filter((p) => p.type === 'grader')
                        .map((p) => (
                          <DropdownMenuItem key={p.id} onClick={() => setSelectedGraderId(p.id)}>
                            {p.name}
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Upload Dataset Button */}
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
                    className="p-2 bg-purple-50 text-primary border border-purple-200 rounded-full hover:bg-purple-100 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                    title="Upload Dataset"
                  >
                    {uploadLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <FileUpIcon size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Upload Toast */}
              {uploadToast && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    uploadToast.type === 'success'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}
                >
                  {uploadToast.message}
                </div>
              )}

              {currentRun && (
                <ResultsGrid
                  run={currentRun}
                  dataset={currentDataset}
                  metricView={metricView}
                  showParsedOnly={showParsedOnly}
                  activeRunId={activeRunId}
                  isHistoricalView={false}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
