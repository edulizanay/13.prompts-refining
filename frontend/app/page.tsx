// ABOUTME: Main page - two-panel layout (Editor left, Results right)
// ABOUTME: Wires state management and orchestrates component rendering

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Prompt, Run, Dataset } from '@/lib/types';
import { initializeSeedData, getUIState, setActiveRunId, getRunById, getDatasetById, deduplicateModels } from '@/lib/mockRepo.temp';
import { EditorPanel } from '@/components/EditorPanel';
import { ResultsGrid } from '@/components/ResultsGrid';
import { ModelManager } from '@/components/ModelManager';

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
  const editorPanelRef = useRef<{ triggerRun: () => Promise<void> }>(null);

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
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Results</h1>
              {currentRun && (
                <ResultsGrid
                  run={currentRun}
                  dataset={currentDataset}
                  metricView={metricView}
                  onMetricViewChange={setMetricView}
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
