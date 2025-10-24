// ABOUTME: Results grid - displays cells in a table layout with models as columns
// ABOUTME: Rows are dataset rows or single row for live execution; owns ResultCell internally

'use client';

import { useEffect, useState } from 'react';
import { Run, Cell, Dataset } from '@/lib/types';
import { truncate, parseOutput, formatGrade, formatTokens, formatCost, formatLatency } from '@/lib/utils';
import { getCellsByRunId, getModelById } from '@/lib/mockRepo.temp';

interface ResultsGridProps {
  run: Run;
  dataset: Dataset | null;
  metricView: 'grade' | 'tokens' | 'cost' | 'latency';
  showParsedOnly: boolean;
}

export function ResultsGrid({ run, dataset, metricView, showParsedOnly }: ResultsGridProps) {
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
                      />
                    ) : (
                      <div className="text-xs text-gray-400">No data</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Expand Modal */}
      {expandedCell && (
        <CellExpandModal
          cell={expandedCell}
          showParsedOnly={showParsedOnly}
          onClose={() => setExpandedCell(null)}
        />
      )}
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
}

function ResultCellView({ cell, showParsedOnly, metricView, onExpandClick }: ResultCellViewProps) {
  const isLoading = cell.status === 'running' || cell.status === 'idle';
  const isError = cell.status === 'error';
  const isMalformed = cell.status === 'malformed';

  // Get the prompt's expected output type - we need to check the run's prompt
  // For now, we'll default to 'none' and parse accordingly
  const expectedOutput = 'none'; // This will be enhanced in later prompts
  const parsed = parseOutput(cell.output_raw, expectedOutput);

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
  let displayText: string;
  if (isError) {
    displayText = cell.error_message || '(No error message)';
  } else {
    displayText = showParsedOnly && parsed.parsed ? parsed.parsed : cell.output_raw || '(No output)';
  }

  const truncatedText = truncate(displayText, 200);

  // Get metric badge text
  const getMetricBadgeText = (): string => {
    if (isError || isMalformed) {
      return '—';
    }
    switch (metricView) {
      case 'grade':
        return cell.graded_value !== null ? formatGrade(cell.graded_value) : '—';
      case 'tokens':
        return formatTokens(cell.tokens_in, cell.tokens_out);
      case 'cost':
        return formatCost(cell.cost);
      case 'latency':
        return formatLatency(cell.latency_ms);
    }
  };

  return (
    <div
      className={`p-3 rounded-md border min-h-[100px] overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
        isError
          ? 'bg-red-50 border-red-200'
          : isMalformed
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-white border-gray-200'
      }`}
      onClick={() => onExpandClick(cell)}
    >
      <div className="space-y-2">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          {isError && (
            <>
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium text-red-700">Error</span>
            </>
          )}
          {isMalformed && (
            <>
              <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium text-yellow-700">Malformed</span>
            </>
          )}
          {!isError && !isMalformed && (
            <>
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium text-green-700">OK</span>
            </>
          )}
        </div>

        {/* Output text */}
        <div className="text-xs text-gray-700 font-mono break-words whitespace-pre-wrap">
          {truncatedText}
        </div>

        {/* Metric badge */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">Click to expand</span>
          <span className="text-xs font-medium text-accent">{getMetricBadgeText()}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal for expanding cell content
 */
interface CellExpandModalProps {
  cell: Cell;
  showParsedOnly: boolean;
  onClose: () => void;
}

function CellExpandModal({ cell, showParsedOnly, onClose }: CellExpandModalProps) {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
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
        <div className="p-6">
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
      </div>
    </div>
  );
}
