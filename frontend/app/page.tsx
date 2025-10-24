// ABOUTME: Main page - two-panel layout (Editor left, Results right)
// ABOUTME: Wires state management and orchestrates component rendering

'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Prompt, Run, Dataset } from '@/lib/types';
import { initializeSeedData, getUIState, setActiveRunId, getRunById, getDatasetById } from '@/lib/mockRepo.temp';
import { EditorPanel } from '@/components/EditorPanel';
import { ToastContainer } from '@/components/ToastContainer';
import { ResultsGrid } from '@/components/ResultsGrid';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [selectedGraderId, setSelectedGraderId] = useState<string | null>(null);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [activeRunId, setActiveRunIdState] = useState<string | null>(null);
  const [currentRun, setCurrentRun] = useState<Run | null>(null);
  const [currentDataset, setCurrentDataset] = useState<Dataset | null>(null);

  useEffect(() => {
    // Initialize seed data on first load
    initializeSeedData();

    // Load UI state
    const uiState = getUIState();
    setActiveRunIdState(uiState.activeRunId);

    setMounted(true);
  }, []);

  // Update global UI state when activeRunId changes
  useEffect(() => {
    setActiveRunId(activeRunId);
  }, [activeRunId]);

  // Track current run and dataset
  useEffect(() => {
    if (activeRunId) {
      const run = getRunById(activeRunId);
      setCurrentRun(run || null);
      if (run?.dataset_id) {
        const dataset = getDatasetById(run.dataset_id);
        setCurrentDataset(dataset || null);
      } else {
        setCurrentDataset(null);
      }
    } else {
      setCurrentRun(null);
      setCurrentDataset(null);
    }
  }, [activeRunId]);

  const handlePromptSelected = useCallback((_prompt: Prompt) => {
    // Prompt selection is handled internally by EditorPanel
  }, []);

  if (!mounted) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Left Panel: Editor (40%) */}
      <div className="w-2/5 border-r border-accent-dark p-6 overflow-y-auto">
        <EditorPanel
          onPromptSelected={handlePromptSelected}
          selectedDatasetId={selectedDatasetId}
          onDatasetSelected={setSelectedDatasetId}
          selectedGraderId={selectedGraderId}
          onGraderSelected={setSelectedGraderId}
          selectedModelIds={selectedModelIds}
          onModelsChange={setSelectedModelIds}
          activeRunId={activeRunId}
          onActiveRunIdChange={setActiveRunIdState}
        />
      </div>

      {/* Right Panel: Results (60%) */}
      <div className="w-3/5 p-6 overflow-y-auto">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Results</h1>
          {currentRun ? (
            <ResultsGrid run={currentRun} dataset={currentDataset} />
          ) : (
            <p className="text-gray-500">Run a prompt to see results here</p>
          )}
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
