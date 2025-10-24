// ABOUTME: Results grid - displays cells in a table layout with models as columns
// ABOUTME: Rows are dataset rows or single row for live execution; owns ResultCell internally

'use client';

import { useEffect, useState } from 'react';
import { Run, Cell, Dataset } from '@/lib/types';
import { truncate, parseOutput, formatGrade, formatTokens, formatCost, formatLatency, gradeToColor } from '@/lib/utils';
import { getCellsByRunId, getModelById, upsertCell } from '@/lib/mockRepo.temp';
import { generateMockCell } from '@/lib/mockRunExecutor.temp';
import { Modal } from '@/components/ui/modal';

interface ResultsGridProps {
  run: Run;
  dataset: Dataset | null;
  metricView: 'grade' | 'tokens' | 'cost' | 'latency';
  onMetricViewChange: (view: 'grade' | 'tokens' | 'cost' | 'latency') => void;
  showParsedOnly: boolean;
  activeRunId: string | null;
  isHistoricalView?: boolean;
}

export function ResultsGrid({ run, dataset, metricView, onMetricViewChange, showParsedOnly, activeRunId, isHistoricalView = false }: ResultsGridProps) {
  const [cells, setCells] = useState<Cell[]>([]);
  const [, setUpdateTrigger] = useState(0);
  const [expandedCell, setExpandedCell] = useState<Cell | null>(null);

  const rowCount = dataset ? dataset.row_count : 1;
  const modelIds = run.model_ids;

  // Poll for cell updates every 500ms
  useEffect(() => {
    const pollInterval = setInterval(() => {
      setCells(getCellsByRunId(run.id));
      setUpdateTrigger((prev) => prev + 1);
    }, 500);

    return () => clearInterval(pollInterval);
  }, [run.id]);

  if (modelIds.length === 0) {
    return <div className="text-sm text-gray-500">No models selected</div>;
  }

  if (rowCount === 0) {
    return <div className="text-sm text-gray-500">No data rows</div>;
  }

  const getCellForRow = (rowIndex: number, modelId: string): Cell | undefined => {
    return cells.find((c) => c.row_index === rowIndex && c.model_id === modelId);
  };

  return (
    <div className="space-y-4">
      {/* Metric Toggle Toolbar */}
      <div className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
        <span className="text-xs font-medium text-gray-600">View:</span>
        {(['grade', 'tokens', 'cost', 'latency'] as const).map((view) => (
          <button
            key={view}
            onClick={() => onMetricViewChange(view)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              metricView === view
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
        {/* Header */}
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {/* Row index header */}
            <th className="px-4 py-2 text-left font-semibold text-gray-700 min-w-[80px]">Row</th>

            {/* Model columns */}
            {modelIds.map((modelId) => {
              const model = getModelById(modelId);
              return (
                <th key={modelId} className="px-4 py-2 text-left font-semibold text-gray-700 min-w-[300px]">
                  {model ? `${model.provider} / ${model.model}` : 'Unknown Model'}
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-200 hover:bg-gray-50">
              {/* Row index cell */}
              <td className="px-4 py-2 text-gray-600 font-medium bg-gray-50">
                {rowIndex + 1}
              </td>

              {/* Model cells */}
              {modelIds.map((modelId) => {
                const cell = getCellForRow(rowIndex, modelId);
                return (
                  <td key={`${rowIndex}-${modelId}`} className="px-4 py-2">
                    {cell ? (
                      <ResultCellView
                        cell={cell}
                        showParsedOnly={showParsedOnly}
                        metricView={metricView}
                        onExpandClick={setExpandedCell}
                        isActiveRun={activeRunId === run.id}
                        isHistoricalView={isHistoricalView}
                        onRerun={(updatedCell) => {
                          setCells((prevCells) =>
                            prevCells.map((c) =>
                              c.run_id === updatedCell.run_id &&
                              c.model_id === updatedCell.model_id &&
                              c.row_index === updatedCell.row_index
                                ? updatedCell
                                : c
                            )
                          );
                        }}
                      />
                    ) : (
                      <div className="text-xs text-gray-400">No data</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Summary Row */}
          <tr className="bg-accent-light border-t-2 border-gray-300 font-semibold">
            <td className="px-4 py-2 text-gray-900 bg-gray-100">Average</td>
            {modelIds.map((modelId) => (
              <td key={`summary-${modelId}`} className="px-4 py-2">
                <SummaryCell cells={cells} modelId={modelId} metricView={metricView} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
        </div>

      {/* Expand Modal */}
      <Modal
        isOpen={expandedCell !== null}
        onClose={() => setExpandedCell(null)}
        size="large"
        hasBackdropClose={true}
        hasEscapeClose={true}
        className="flex flex-col max-h-[80vh]"
      >
        {expandedCell && (
          <CellExpandModalContent
            cell={expandedCell}
            showParsedOnly={showParsedOnly}
            onClose={() => setExpandedCell(null)}
          />
        )}
      </Modal>
    </div>
  );
}

/**
 * Internal cell view - displays cell content with loading/error states
 */
interface ResultCellViewProps {
  cell: Cell;
  showParsedOnly: boolean;
  metricView: 'grade' | 'tokens' | 'cost' | 'latency';
  onExpandClick: (cell: Cell) => void;
  isActiveRun: boolean;
  isHistoricalView: boolean;
  onRerun: (cell: Cell) => void;
}

function ResultCellView({ cell, showParsedOnly, metricView, onExpandClick, isActiveRun, isHistoricalView, onRerun }: ResultCellViewProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [showGraderOverlay, setShowGraderOverlay] = useState(false);
  const isLoading = cell.status === 'running' || cell.status === 'idle';
  const isError = cell.status === 'error';
  const isMalformed = cell.status === 'malformed';
  const isTerminal = cell.status === 'ok' || cell.status === 'error' || cell.status === 'malformed';

  // Get the prompt's expected output type - we need to check the run's prompt
  // For now, we'll default to 'none' and parse accordingly
  const expectedOutput = 'none'; // This will be enhanced in later prompts
  const parsed = parseOutput(cell.output_raw, expectedOutput);

  const handleRerun = async () => {
    // Mark as running
    const rerunningCell: Cell = { ...cell, status: 'running' as const };
    upsertCell(rerunningCell);
    onRerun(rerunningCell);

    // Wait a bit for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate new mock data
    const mockData = generateMockCell();
    const updatedCell: Cell = { ...cell, ...mockData };
    upsertCell(updatedCell);
    onRerun(updatedCell);
  };

  if (isLoading) {
    return (
      <div className="p-3 bg-gray-50 rounded-md border border-gray-200 min-h-[100px] flex items-center justify-center">
        <div className="space-y-2 w-full">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
        </div>
      </div>
    );
  }

  // Determine which text to display based on global toggle
  // If grader overlay is open, show grader output; otherwise show generator output
  let displayText: string;
  if (showGraderOverlay && cell.grader_parsed) {
    displayText = cell.grader_parsed;
  } else if (isError) {
    displayText = cell.error_message || '(No error message)';
  } else {
    displayText = showParsedOnly && parsed.parsed ? parsed.parsed : cell.output_raw || '(No output)';
  }

  const truncatedText = truncate(displayText, 200);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        // Close grader overlay when mouse leaves cell
        setShowGraderOverlay(false);
      }}
      onClick={() => {
        if (showGraderOverlay) {
          // Clicking inside grader overlay area doesn't do anything
          return;
        }
        onExpandClick(cell);
      }}
    >
      <div
        className={`p-3 rounded-md border min-h-[100px] overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
          isError
            ? 'bg-white border-2 border-red-600'
            : isMalformed
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-white border-gray-200'
        }`}
      >
        <div className="text-xs text-gray-700 font-mono break-words whitespace-pre-wrap">
          {truncatedText}
        </div>
      </div>

      {/* Unified Metric Badge - Bottom Right */}
      {!isLoading && (
        <div className="absolute bottom-2 right-2 pointer-events-auto">
          <MetricBadge
            cell={cell}
            metricView={metricView}
            showGraderOverlay={showGraderOverlay}
            onToggleGrader={() => setShowGraderOverlay(!showGraderOverlay)}
            isError={isError}
            isMalformed={isMalformed}
          />
        </div>
      )}

      {/* Hover Overlay */}
      {isHovering && isActiveRun && isTerminal && !isHistoricalView && (
        <div className="absolute inset-0 bg-black/10 rounded-md flex items-start justify-end p-2 pointer-events-none">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRerun();
            }}
            className="pointer-events-auto p-2 bg-white rounded-md shadow-md hover:bg-gray-50 transition-colors"
            title="Re-run this cell"
          >
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Modal content for expanding cell details
 */
interface CellExpandModalContentProps {
  cell: Cell;
  showParsedOnly: boolean;
  onClose: () => void;
}

function CellExpandModalContent({ cell, showParsedOnly, onClose }: CellExpandModalContentProps) {
  const isError = cell.status === 'error';
  const isMalformed = cell.status === 'malformed';

  // Parse output using the same logic
  const expectedOutput = 'none'; // This will be enhanced in later prompts
  const parsed = parseOutput(cell.output_raw, expectedOutput);

  // Determine which text to display based on global toggle
  let displayText: string;
  if (isError) {
    displayText = cell.error_message || '(No error message)';
  } else {
    displayText = showParsedOnly && parsed.parsed ? parsed.parsed : cell.output_raw || '(No output)';
  }

  return (
    <>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Cell Details</h2>
          <p className="text-xs text-gray-500 mt-1">
            {showParsedOnly ? 'Parsed Output' : 'Full Output'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 overflow-auto">
        <div
          className={`p-4 rounded-md border font-mono text-sm whitespace-pre-wrap break-words ${
            isError
              ? 'bg-red-50 border-red-200 text-red-700'
              : isMalformed
                ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                : 'bg-gray-50 border-gray-200 text-gray-900'
          }`}
        >
          {displayText}
        </div>

        {/* Metadata */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Tokens</p>
            <p className="text-sm font-mono text-gray-900">
              {formatTokens(cell.tokens_in, cell.tokens_out)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Cost</p>
            <p className="text-sm font-mono text-gray-900">{formatCost(cell.cost)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Latency</p>
            <p className="text-sm font-mono text-gray-900">{formatLatency(cell.latency_ms)}</p>
          </div>
          {cell.graded_value !== null && (
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Grade</p>
              <p className="text-sm font-mono text-gray-900">{formatGrade(cell.graded_value)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-md font-medium hover:bg-gray-300 transition-colors"
        >
          Close
        </button>
      </div>
    </>
  );
}

/**
 * Unified metric badge component - displays current metric (grade/tokens/cost/latency)
 * Interactive when showing grade with grader available
 */
interface MetricBadgeProps {
  cell: Cell;
  metricView: 'grade' | 'tokens' | 'cost' | 'latency';
  showGraderOverlay: boolean;
  onToggleGrader: () => void;
  isError: boolean;
  isMalformed: boolean;
}

function MetricBadge({ cell, metricView, showGraderOverlay, onToggleGrader, isError, isMalformed }: MetricBadgeProps) {
  const hasGrader = cell.graded_value !== null && cell.grader_parsed;
  const isGradeView = metricView === 'grade';
  const isClickable = isGradeView && hasGrader;

  // Determine badge content based on metric view
  let badgeContent: string;
  let badgeColor: string = 'bg-gradient-to-br from-purple-200 to-purple-300 text-purple-900';

  if (isError || isMalformed) {
    badgeContent = '—';
    badgeColor = 'bg-gradient-to-br from-purple-200 to-purple-300 text-purple-900';
  } else if (isGradeView) {
    badgeContent = cell.graded_value !== null ? formatGrade(cell.graded_value) : '—';
    const colorClass = cell.graded_value !== null ? gradeToColor(cell.graded_value) : 'gray';
    const gradientMap: Record<string, string> = {
      green: 'bg-green-50 text-green-700 border border-green-200',
      yellow: 'bg-amber-50 text-amber-700 border border-amber-200',
      red: 'bg-red-50 text-red-700 border border-red-200',
      gray: 'bg-gradient-to-br from-purple-200 to-purple-300 text-purple-900',
    };
    badgeColor = gradientMap[colorClass];
  } else if (metricView === 'tokens') {
    badgeContent = formatTokens(cell.tokens_in, cell.tokens_out);
  } else if (metricView === 'cost') {
    badgeContent = formatCost(cell.cost);
  } else if (metricView === 'latency') {
    badgeContent = formatLatency(cell.latency_ms);
  } else {
    badgeContent = '—';
  }

  const commonClasses = `min-w-[63px] px-2 py-1.5 rounded-lg font-semibold text-[0.6125rem] leading-tight transition-all shadow-md text-center ${badgeColor}`;
  const clickableClasses = isClickable ? 'hover:shadow-lg cursor-pointer' : '';

  if (isClickable) {
    return (
      <button
        className={`${commonClasses} ${clickableClasses} ${showGraderOverlay ? 'ring-2 ring-blue-400' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleGrader();
        }}
        title={hasGrader ? 'Click to view grader output' : undefined}
      >
        {badgeContent}
      </button>
    );
  }

  return (
    <div className={`${commonClasses} flex items-center justify-center`}>
      {badgeContent}
    </div>
  );
}

/**
 * Summary cell component - shows averages for a model column
 */
interface SummaryCellProps {
  cells: Cell[];
  modelId: string;
  metricView: 'grade' | 'tokens' | 'cost' | 'latency';
}

function SummaryCell({ cells, modelId, metricView }: SummaryCellProps) {
  // Filter cells for this model, excluding errors and malformed
  const validCells = cells.filter(
    (c) => c.model_id === modelId && c.status === 'ok'
  );

  if (validCells.length === 0) {
    return <div className="text-xs text-gray-400">—</div>;
  }

  // Calculate averages
  if (metricView === 'grade') {
    const avg = validCells.reduce((sum, c) => sum + (c.graded_value ?? 0), 0) / validCells.length;
    return <div className="text-xs font-medium text-gray-900">{formatGrade(avg)}</div>;
  }

  if (metricView === 'tokens') {
    const avgIn = validCells.reduce((sum, c) => sum + c.tokens_in, 0) / validCells.length;
    const avgOut = validCells.reduce((sum, c) => sum + c.tokens_out, 0) / validCells.length;
    return <div className="text-xs font-medium text-gray-900">{formatTokens(Math.round(avgIn), Math.round(avgOut))}</div>;
  }

  if (metricView === 'cost') {
    const avg = validCells.reduce((sum, c) => sum + c.cost, 0) / validCells.length;
    return <div className="text-xs font-medium text-gray-900">{formatCost(avg)}</div>;
  }

  if (metricView === 'latency') {
    const avg = validCells.reduce((sum, c) => sum + c.latency_ms, 0) / validCells.length;
    return <div className="text-xs font-medium text-gray-900">{formatLatency(Math.round(avg))}</div>;
  }

  return <div className="text-xs text-gray-400">—</div>;
}
