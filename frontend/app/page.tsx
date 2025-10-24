// ABOUTME: Main page - two-panel layout (Editor left, Results right)
// ABOUTME: Wires state management and orchestrates component rendering

'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Prompt } from '@/lib/types';
import { initializeSeedData, getUIState, setActiveRunId } from '@/lib/mockRepo.temp';
import { EditorPanel } from '@/components/EditorPanel';
import { ToastContainer } from '@/components/ToastContainer';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [selectedGraderId, setSelectedGraderId] = useState<string | null>(null);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [activeRunId, setActiveRunIdState] = useState<string | null>(null);

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
          <p className="text-gray-500">Results grid coming soon...</p>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
