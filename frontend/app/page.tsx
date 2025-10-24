// ABOUTME: Main page - two-panel layout (Editor left, Results right)
// ABOUTME: Wires state management and orchestrates component rendering

'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Prompt, Run, Dataset } from '@/lib/types';
import { initializeSeedData, getUIState, setActiveRunId, getRunById, getDatasetById, getAllRuns } from '@/lib/mockRepo.temp';
import { EditorPanel } from '@/components/EditorPanel';
import { ResultsGrid } from '@/components/ResultsGrid';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [selectedGraderId, setSelectedGraderId] = useState<string | null>(null);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [activeRunId, setActiveRunIdState] = useState<string | null>(null);
  const [currentRun, setCurrentRun] = useState<Run | null>(null);
  const [currentDataset, setCurrentDataset] = useState<Dataset | null>(null);
  const [metricView, setMetricView] = useState<'grade' | 'tokens' | 'cost' | 'latency'>('grade');
  const [showParsedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'current' | 'history'>('current');
  const [selectedHistoryRunId, setSelectedHistoryRunId] = useState<string | null>(null);

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
    if (viewMode === 'history' && selectedHistoryRunId) {
      const run = getRunById(selectedHistoryRunId);
      setCurrentRun(run || null);
      if (run?.dataset_id) {
        const dataset = getDatasetById(run.dataset_id);
        setCurrentDataset(dataset || null);
      } else {
        setCurrentDataset(null);
      }
    } else if (viewMode === 'current' && activeRunId) {
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
  }, [activeRunId, viewMode, selectedHistoryRunId]);

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
      <div className="w-3/5 p-6 overflow-y-auto flex flex-col">
        <div className="space-y-4 flex-1">
          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => {
                setViewMode('current');
                setSelectedHistoryRunId(null);
              }}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                viewMode === 'current'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Current
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                viewMode === 'history'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              History
            </button>
          </div>

          {/* Current View */}
          {viewMode === 'current' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Results</h1>
              {currentRun ? (
                <ResultsGrid
                  run={currentRun}
                  dataset={currentDataset}
                  metricView={metricView}
                  onMetricViewChange={setMetricView}
                  showParsedOnly={showParsedOnly}
                  activeRunId={activeRunId}
                  isHistoricalView={false}
                />
              ) : (
                <p className="text-gray-500">Run a prompt to see results here</p>
              )}
            </div>
          )}

          {/* History View */}
          {viewMode === 'history' && (
            <HistoryPanel
              selectedPromptId={currentRun?.prompt_id || ''}
              selectedHistoryRunId={selectedHistoryRunId}
              onSelectRun={setSelectedHistoryRunId}
              dataset={currentDataset}
              metricView={metricView}
              onMetricViewChange={setMetricView}
              showParsedOnly={showParsedOnly}
              onBackToCurrent={() => {
                setViewMode('current');
                setSelectedHistoryRunId(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * History Panel Component - displays list of past runs and historical view
 */
interface HistoryPanelProps {
  selectedPromptId: string;
  selectedHistoryRunId: string | null;
  onSelectRun: (runId: string) => void;
  dataset: Dataset | null;
  metricView: 'grade' | 'tokens' | 'cost' | 'latency';
  onMetricViewChange: (view: 'grade' | 'tokens' | 'cost' | 'latency') => void;
  showParsedOnly: boolean;
  onBackToCurrent: () => void;
}

function HistoryPanel({
  selectedPromptId,
  selectedHistoryRunId,
  onSelectRun,
  dataset,
  metricView,
  onMetricViewChange,
  showParsedOnly,
  onBackToCurrent,
}: HistoryPanelProps) {
  const historicalRuns = getAllRuns()
    .filter((r) => r.prompt_id === selectedPromptId)
    .sort((a, b) => b.id.localeCompare(a.id));

  const displayRun = selectedHistoryRunId ? getRunById(selectedHistoryRunId) : null;

  if (!displayRun) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Run History</h2>
        {historicalRuns.length === 0 ? (
          <p className="text-gray-500 text-sm">No previous runs</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg">
            {historicalRuns.map((run) => (
                <button
                  key={run.id}
                  onClick={() => onSelectRun(run.id)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{run.version_label}</p>
                      <p className="text-xs text-gray-500">{run.model_ids.length} model(s)</p>
                    </div>
                    <span className="text-xs text-gray-400">→</span>
                  </div>
                </button>
              ))}

          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Historical View Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-sm font-medium text-yellow-900">Historical View</p>
        <p className="text-xs text-yellow-700 mt-1">Viewing run: {displayRun.version_label}</p>
      </div>

      {/* Grid */}
      <ResultsGrid
        run={displayRun}
        dataset={dataset}
        metricView={metricView}
        onMetricViewChange={onMetricViewChange}
        showParsedOnly={showParsedOnly}
        activeRunId={null}
        isHistoricalView={true}
      />

      {/* Back Button */}
      <button
        onClick={onBackToCurrent}
        className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-md font-medium hover:bg-gray-300 transition-colors text-sm"
      >
        Back to Current
      </button>
    </div>
  );
}
