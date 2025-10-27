// ABOUTME: Main page - two-panel layout (Editor left, Results right)
// ABOUTME: Wires state management and orchestrates component rendering

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { FileUpIcon, FlaskConicalIcon } from 'lucide-react';
import type { Prompt, Run, Dataset } from '@/lib/types';
import { initializeSeedData, getUIState, setActiveRunId, getRunById, deduplicateModels, getAllModels } from '@/lib/mockRepo.temp';
import { getAllPrompts } from '@/lib/services/prompts.client';
import { getDatasetById, createDataset as createDatasetAPI } from '@/lib/services/datasets.client';
import { EditorPanel } from '@/components/EditorPanel';
import { ResultsGrid } from '@/components/ResultsGrid';
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
  const [metricFading, setMetricFading] = useState(false);
  const [showParsedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'focus' | 'balanced'>('balanced');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadToast, setUploadToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const editorPanelRef = useRef<{ triggerRun: () => Promise<void> }>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function initialize() {
      // Initialize seed data on first load
      initializeSeedData();

      // Clean up any duplicate models
      deduplicateModels();

      // Load UI state
      const uiState = getUIState();
      setActiveRunIdState(uiState.activeRunId);
      setDisplayRunId(uiState.activeRunId);

      // Load view mode preference from localStorage
      const savedViewMode = localStorage.getItem('viewMode');
      if (savedViewMode === 'focus' || savedViewMode === 'balanced') {
        setViewMode(savedViewMode);
      }

      // Load prompts
      try {
        const allPrompts = await getAllPrompts();
        setPrompts(allPrompts);
      } catch (error) {
        console.error('[Page] Failed to load prompts:', error);
      }

      // Initialize with first model if none selected
      const allModels = getAllModels();
      if (allModels.length > 0 && selectedModelIds.length === 0) {
        setSelectedModelIds([allModels[0].id]);
      }

      setMounted(true);
    }

    initialize();
  }, []);

  // Change view mode with transition lock
  const changeViewMode = useCallback((newMode: 'focus' | 'balanced') => {
    if (isTransitioning || viewMode === newMode) return;

    setIsTransitioning(true);
    setViewMode(newMode);
    localStorage.setItem('viewMode', newMode);

    // Clear transition lock after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [viewMode, isTransitioning]);

  // Auto-trigger focus mode when editor is focused
  const handleEditorFocus = useCallback(() => {
    changeViewMode('focus');
  }, [changeViewMode]);

  // Auto-trigger balanced mode when editor loses focus
  const handleEditorBlur = useCallback(() => {
    changeViewMode('balanced');
  }, [changeViewMode]);

  // Auto-trigger balanced mode when run is clicked
  const handleRunClick = useCallback(() => {
    changeViewMode('balanced');
  }, [changeViewMode]);

  const handlePromptSelected = useCallback((_prompt: Prompt) => {
    // Prompt selection is handled internally by EditorPanel
  }, []);

  // Cycle through metric views with fade transition
  const cycleMetricView = useCallback(() => {
    const metrics: Array<'grade' | 'tokens' | 'cost' | 'latency'> = ['grade', 'tokens', 'cost', 'latency'];
    const currentIndex = metrics.indexOf(metricView);
    const nextIndex = (currentIndex + 1) % metrics.length;

    setMetricFading(true);
    setTimeout(() => {
      setMetricView(metrics[nextIndex]);
      setMetricFading(false);
    }, 150);
  }, [metricView]);

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
    async function loadRunAndDataset() {
      if (displayRunId) {
        const run = getRunById(displayRunId);
        setCurrentRun(run || null);
        if (run?.dataset_id) {
          try {
            const dataset = await getDatasetById(run.dataset_id);
            setCurrentDataset(dataset || null);
          } catch (error) {
            console.error('[Page] Failed to load dataset:', error);
            setCurrentDataset(null);
          }
        } else {
          setCurrentDataset(null);
        }
      } else {
        setCurrentRun(null);
        setCurrentDataset(null);
      }
    }

    loadRunAndDataset();
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      // Use API to create dataset
      const dataset = await createDatasetAPI(file);
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
    <div className="p-6 h-screen w-full bg-neutral-50 flex flex-col">
      <div className="flex h-full gap-3 p-6">
        {/* Left Panel: Editor */}
        <div
          style={{ width: viewMode === 'focus' ? '65%' : '30%' }}
          className="overflow-y-auto px-6 transition-all duration-comfortable ease-spring"
        >
          <EditorPanel
            ref={editorPanelRef}
            onPromptSelected={handlePromptSelected}
            selectedDatasetId={selectedDatasetId}
            onDatasetSelected={setSelectedDatasetId}
            selectedGraderId={selectedGraderId}
            selectedModelIds={selectedModelIds}
            activeRunId={activeRunId}
            onActiveRunIdChange={setActiveRunIdState}
            onEditorFocus={handleEditorFocus}
            onEditorBlur={handleEditorBlur}
            onRunClick={handleRunClick}
          />
        </div>

        {/* Right Panel: Results */}
        <div
          style={{ width: viewMode === 'focus' ? '35%' : '70%' }}
          className="overflow-y-auto flex flex-col px-6 transition-all duration-comfortable ease-spring"
        >
            <div className="space-y-4 flex-1">
              {/* Wrapper to constrain toolbar and table to same width */}
              <div className="w-fit max-w-full">
                {/* Toolbar container with metric view carousel and upload button */}
                <div className="flex gap-2 items-center bg-neutral-50 p-3 rounded-lg border border-neutral-200 mb-4">
                  <button
                    onClick={cycleMetricView}
                    className={`px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-500 border border-purple-200 rounded-full hover:bg-purple-100 hover:border-purple-500 transition-all duration-150 min-w-[64px] ${
                      metricFading ? 'opacity-0' : 'opacity-100'
                    }`}
                    style={{ transition: 'opacity 150ms ease-in-out' }}
                  >
                    {metricView.charAt(0).toUpperCase() + metricView.slice(1)}
                  </button>

                  {/* Grader Selector Button */}
                  <div className="ml-auto flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="px-4 py-2 bg-purple-50 text-purple-500 border border-purple-200 rounded-full hover:bg-purple-100 hover:border-purple-500 transition-[width,background-color,border-color] duration-fast ease-in-out text-sm font-medium flex items-center gap-2">
                          <span key={selectedGraderId || 'no-grader'} className="animate-scale-in-content">
                            {selectedGraderId ? (
                              <span>{prompts.find(p => p.id === selectedGraderId)?.name}</span>
                            ) : (
                              <FlaskConicalIcon size={16} />
                            )}
                          </span>
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
                      className="p-2 bg-purple-50 text-purple-500 border border-purple-200 rounded-full hover:bg-purple-100 hover:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                      title="Upload Dataset"
                    >
                      {uploadLoading ? (
                        <span className="inline-block w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <FileUpIcon size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Upload Toast */}
                {uploadToast && (
                  <div
                    className={`p-3 rounded-lg text-sm mb-4 ${
                      uploadToast.type === 'success'
                        ? 'bg-success-50 text-success-600 border border-success-500'
                        : 'bg-error-50 text-error-600 border border-error-500'
                    }`}
                  >
                    {uploadToast.message}
                  </div>
                )}

                {/* Results Grid - always render, pass null run when no run exists */}
                <ResultsGrid
                  run={currentRun}
                  dataset={currentDataset}
                  metricView={metricView}
                  showParsedOnly={showParsedOnly}
                  activeRunId={activeRunId}
                  isHistoricalView={false}
                  selectedModelIds={selectedModelIds}
                  onModelsChange={setSelectedModelIds}
                />
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
