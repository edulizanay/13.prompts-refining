// ABOUTME: Results grid - displays cells in a table layout with models as columns
// ABOUTME: Rows are dataset rows or single row for live execution; owns ResultCell internally

'use client';

import { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Run, Cell, Dataset, Model } from '@/lib/types';
import { truncate, parseOutput, formatGrade, formatTokens, formatCost, formatLatency, gradeToStyles } from '@/lib/utils';
import { getCellsByRunId, getModelById, upsertCell, getAllModels, createModel, getModelByProviderAndName, deleteCellsByColumnIndex, shiftCellColumnIndices } from '@/lib/mockRepo.temp';
import { generateMockCell } from '@/lib/mockRunExecutor.temp';
import { Modal } from '@/components/ui/modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ResultsGridProps {
  run: Run | null;
  dataset: Dataset | null;
  metricView: 'grade' | 'tokens' | 'cost' | 'latency';
  showParsedOnly: boolean;
  activeRunId: string | null;
  isHistoricalView?: boolean;
  selectedModelIds: string[];
  onModelsChange: (modelIds: string[]) => void;
}

const MAX_MODELS = 4;

export function ResultsGrid({ run, dataset, metricView, showParsedOnly, activeRunId, isHistoricalView = false, selectedModelIds, onModelsChange }: ResultsGridProps) {
  const [cells, setCells] = useState<Cell[]>([]);
  const [, setUpdateTrigger] = useState(0);
  const [expandedCell, setExpandedCell] = useState<Cell | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [mounted, setMounted] = useState(false);

  const rowCount = dataset ? dataset.row_count : 1;
  const modelIds = selectedModelIds;

  // Initialize models on mount
  useEffect(() => {
    const allModels = getAllModels();
    setModels(allModels);

    // Initialize provider/model selectors
    if (allModels.length > 0) {
      const firstProvider = allModels[0].provider;
      setSelectedProvider(firstProvider);
      const firstModel = allModels.find(m => m.provider === firstProvider);
      if (firstModel) {
        setSelectedModel(firstModel.model);
      }
    }

    setMounted(true);
  }, []);

  // Poll for cell updates every 500ms (only if run exists)
  useEffect(() => {
    if (!run) return;

    const pollInterval = setInterval(() => {
      setCells(getCellsByRunId(run.id));
      setUpdateTrigger((prev) => prev + 1);
    }, 500);

    return () => clearInterval(pollInterval);
  }, [run]);

  // Model management functions
  const handleAddModel = () => {
    if (selectedModelIds.length >= MAX_MODELS) {
      return;
    }

    let model = getModelByProviderAndName(selectedProvider, selectedModel);
    if (!model) {
      model = createModel(selectedProvider, selectedModel);
    }
    setModels(getAllModels());

    if (editingIndex !== null) {
      // Editing existing model - clear old cells for this column to prevent stale data
      if (run) {
        deleteCellsByColumnIndex(run.id, editingIndex);
      }
      const newModelIds = [...selectedModelIds];
      newModelIds[editingIndex] = model.id;
      onModelsChange(newModelIds);
      setEditingIndex(null);
    } else {
      // Adding new model
      onModelsChange([...selectedModelIds, model.id]);
    }
    setShowDialog(false);
  };

  const handleRemoveModel = (index: number) => {
    if (selectedModelIds.length <= 1) return; // Minimum 1 model

    // Shift column indices for cells to the right of the removed column
    if (run) {
      shiftCellColumnIndices(run.id, index);
    }

    onModelsChange(selectedModelIds.filter((_, i) => i !== index));
  };

  const handleEditModel = (index: number) => {
    // Pre-populate dialog with current model's values
    const currentModelId = selectedModelIds[index];
    const currentModel = getModelById(currentModelId);
    if (currentModel) {
      setSelectedProvider(currentModel.provider);
      setSelectedModel(currentModel.model);
    }
    setEditingIndex(index);
    setShowDialog(true);
  };

  const handleOpenAddDialog = () => {
    setEditingIndex(null);
    setShowDialog(true);
  };

  const getCellForRow = (rowIndex: number, columnIndex: number, expectedModelId: string): Cell | undefined => {
    const cell = cells.find((c) => c.row_index === rowIndex && c.column_index === columnIndex);
    // Verify the cell's model_id matches the current model in this column position
    // If model was changed/reordered, this prevents showing stale data
    if (cell && cell.model_id !== expectedModelId) {
      return undefined; // Treat as "No data" if model doesn't match
    }
    return cell;
  };

  if (!mounted) return null;

  if (modelIds.length === 0) {
    return <div className="text-sm text-neutral-500">No models selected</div>;
  }

  if (rowCount === 0) {
    return <div className="text-sm text-neutral-500">No data rows</div>;
  }

  const providers = Array.from(new Set(models.map((m) => m.provider)));
  const modelsForProvider = models.filter((m) => m.provider === selectedProvider);

  return (
    <div className="space-y-4">
      {/* Table and Add Button Container */}
      <div className="flex items-start gap-2">
        {/* Results Table */}
        <div className="w-fit overflow-x-auto border border-neutral-200 rounded-lg">
        {/* IMPORTANT: Cells must have fixed width to prevent layout shifts during content updates */}
        <table className="text-sm table-fixed">
        {/* Header */}
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-200">
            {/* Row index header - FIXED WIDTH (w-14 = 56px, 10% narrower than original 64px, DO NOT CHANGE) */}
            <th className="px-[15px] py-2 text-left font-semibold text-neutral-700 w-14">Row</th>

            {/* Model columns - FIXED WIDTH (w-[310px] = 3% narrower than original 320px, DO NOT CHANGE to prevent layout shifts) */}
            {modelIds.map((modelId, index) => {
              const model = getModelById(modelId);
              return (
                <th key={`col-${index}`} className="px-[15px] py-2 text-left font-semibold text-neutral-700 w-[310px] text-[0.8em]">
                  <div className="group flex items-center justify-between">
                    <button
                      onClick={() => handleEditModel(index)}
                      className="flex-1 text-left hover:text-purple-500 transition-colors"
                      title="Click to change model"
                    >
                      {model ? `${model.provider} / ${model.model}` : 'Unknown Model'}
                    </button>
                    {modelIds.length > 1 && (
                      <button
                        onClick={() => handleRemoveModel(index)}
                        className="ml-2 text-neutral-400 hover:text-error-600 font-bold transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove model"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-neutral-200 hover:bg-neutral-50">
              {/* Row index cell - FIXED WIDTH (w-14 = 56px, 10% narrower than original 64px, DO NOT CHANGE) */}
              <td className="px-[15px] py-2 text-neutral-600 font-medium bg-neutral-50 w-14">
                {rowIndex + 1}
              </td>

              {/* Model cells - FIXED WIDTH (w-[310px] = 3% narrower than original 320px, DO NOT CHANGE to prevent layout shifts) */}
              {modelIds.map((modelId, columnIndex) => {
                const cell = getCellForRow(rowIndex, columnIndex, modelId);
                return (
                  <td key={`${rowIndex}-${columnIndex}`} className="px-[15px] py-2 w-[310px]">
                    {cell ? (
                      <ResultCellView
                        cell={cell}
                        showParsedOnly={showParsedOnly}
                        metricView={metricView}
                        onExpandClick={setExpandedCell}
                        isActiveRun={run !== null && activeRunId === run.id}
                        isHistoricalView={isHistoricalView}
                        onRerun={(updatedCell) => {
                          setCells((prevCells) =>
                            prevCells.map((c) =>
                              c.run_id === updatedCell.run_id &&
                              c.column_index === updatedCell.column_index &&
                              c.row_index === updatedCell.row_index
                                ? updatedCell
                                : c
                            )
                          );
                        }}
                      />
                    ) : (
                      <div className="text-xs text-neutral-400">No data</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Summary Row - FIXED WIDTH (must match header/body cells, DO NOT CHANGE) */}
          <tr className="bg-purple-50 border-t-2 border-neutral-300 font-semibold">
            <td className="px-[15px] py-2 text-neutral-900 bg-neutral-100 w-14">Avg</td>
            {modelIds.map((modelId, columnIndex) => (
              <td key={`summary-${columnIndex}`} className="px-[15px] py-2 w-[310px]">
                <SummaryCell cells={cells} columnIndex={columnIndex} modelId={modelId} metricView={metricView} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
        </div>

        {/* Add Model Button - outside table */}
        {modelIds.length < MAX_MODELS && (
          <button
            onClick={handleOpenAddDialog}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-purple-500 hover:bg-purple-50 rounded-full transition-all border-0"
            title="Add model"
          >
            <span className="text-2xl leading-none">+</span>
          </button>
        )}
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

      {/* Add/Edit Model Dialog */}
      <Modal
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        size="small"
        hasBackdropClose={true}
        hasEscapeClose={true}
        className="p-6"
      >
        <h3 className="text-lg font-bold text-neutral-900 mb-4">
          {editingIndex !== null ? 'Edit Model' : 'Add Model'}
        </h3>

        <div className="space-y-4">
          {/* Provider selector */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Provider</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-left bg-white hover:bg-neutral-50">
                  {selectedProvider}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                {providers.map((p) => (
                  <DropdownMenuItem
                    key={p}
                    onClick={() => {
                      setSelectedProvider(p);
                      const first = models.find((m) => m.provider === p);
                      if (first) setSelectedModel(first.model);
                    }}
                  >
                    {p}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Model selector */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Model</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-left bg-white hover:bg-neutral-50">
                  {selectedModel}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                {modelsForProvider.map((m) => (
                  <DropdownMenuItem key={m.model} onClick={() => setSelectedModel(m.model)}>
                    {m.model}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Dialog buttons */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={handleAddModel}
            className="w-full px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-opacity-90 text-sm font-medium"
          >
            {editingIndex !== null ? 'Save' : 'Add'}
          </button>
        </div>
        <p className="text-xs text-neutral-500 mt-2 text-center">Press <kbd className="bg-neutral-100 px-1 rounded text-xs">Esc</kbd> to cancel</p>
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

  const handleManualGradeToggle = (newGrade: number | null) => {
    const updatedCell: Cell = { ...cell, manual_grade: newGrade };
    upsertCell(updatedCell);
    onRerun(updatedCell);
  };

  if (isLoading) {
    return (
      <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200 min-h-[100px] flex items-center justify-center">
        <div className="space-y-2 w-full">
          <div className="h-4 bg-neutral-200 rounded animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-neutral-200 rounded animate-pulse w-4/6" />
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
            ? 'bg-white border-2 border-error-600'
            : isMalformed
              ? 'bg-warning-50 border-warning-200'
              : 'bg-white border-neutral-200'
        }`}
      >
        <div className="text-xs text-neutral-700 font-mono break-words whitespace-pre-wrap">
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
            hasGrader={cell.graded_value !== null && cell.grader_parsed !== null}
            onManualGradeToggle={handleManualGradeToggle}
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
            className="pointer-events-auto p-2 bg-white rounded-md shadow-md hover:bg-neutral-50 transition-colors"
            title="Re-run this cell"
          >
            <svg className="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  onClose?: () => void;
}

function CellExpandModalContent({ cell, showParsedOnly }: CellExpandModalContentProps) {
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
      {/* Content */}
      <div className="p-6 flex-1 overflow-auto">
        <div
          className={`p-4 rounded-md border font-mono text-sm whitespace-pre-wrap break-words ${
            isError
              ? 'bg-error-50 border-error-200 text-error-700'
              : isMalformed
                ? 'bg-warning-50 border-warning-200 text-warning-700'
                : 'bg-neutral-50 border-neutral-200 text-neutral-900'
          }`}
        >
          {displayText}
        </div>

        {/* Metadata */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-neutral-200 pt-4">
          <div>
            <p className="text-xs text-neutral-500 uppercase font-medium">Tokens</p>
            <p className="text-sm font-mono text-neutral-900">
              {formatTokens(cell.tokens_in, cell.tokens_out)}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 uppercase font-medium">Cost</p>
            <p className="text-sm font-mono text-neutral-900">{formatCost(cell.cost)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 uppercase font-medium">Latency</p>
            <p className="text-sm font-mono text-neutral-900">{formatLatency(cell.latency_ms)}</p>
          </div>
          {cell.graded_value !== null && (
            <div>
              <p className="text-xs text-neutral-500 uppercase font-medium">Grade</p>
              <p className="text-sm font-mono text-neutral-900">{formatGrade(cell.graded_value)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-neutral-200 bg-white">
        <p className="text-xs text-neutral-500 text-center">Press <kbd className="bg-neutral-100 px-1 rounded text-xs">Esc</kbd> to close</p>
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
  hasGrader: boolean;
  onManualGradeToggle: (newGrade: number | null) => void;
}

function MetricBadge({ cell, metricView, showGraderOverlay, onToggleGrader, isError, isMalformed, hasGrader, onManualGradeToggle }: MetricBadgeProps) {
  const isGradeView = metricView === 'grade';
  const isClickable = isGradeView && hasGrader;
  const showManualToggle = isGradeView && !hasGrader && !isError && !isMalformed;

  // Determine which grade to display (manual takes precedence)
  const displayGrade = cell.manual_grade !== null ? cell.manual_grade : cell.graded_value;

  // Handle manual grade toggle
  const handleManualToggle = () => {
    if (cell.manual_grade === null) {
      onManualGradeToggle(1.0); // null -> green (100%)
    } else if (cell.manual_grade === 1.0) {
      onManualGradeToggle(0.0); // green -> red (0%)
    } else {
      onManualGradeToggle(1.0); // red -> green (100%)
    }
  };

  // Determine badge content based on metric view
  let badgeContent: string;
  let badgeColor: string = 'bg-gradient-to-br from-purple-200 to-purple-300 text-purple-900';

  if (isError || isMalformed) {
    badgeContent = '—';
    badgeColor = 'bg-gradient-to-br from-purple-200 to-purple-300 text-purple-900';
  } else if (isGradeView) {
    badgeContent = displayGrade !== null ? formatGrade(displayGrade) : '—';
    const styles = gradeToStyles(displayGrade);
    badgeColor = `${styles.bgClass} ${styles.textClass} border ${styles.borderClass}`;
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

  // Manual toggle with thumbs icon
  if (showManualToggle) {
    const styles = gradeToStyles(displayGrade);
    const isGreen = displayGrade === 1.0;
    const isRed = displayGrade === 0.0;
    const isNeutral = displayGrade === null;

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleManualToggle();
        }}
        className={`flex items-center justify-center min-w-[63px] px-2 py-1.5 rounded-lg font-semibold text-[0.6125rem] leading-tight transition-all shadow-md border ${
          isNeutral
            ? 'bg-purple-50 text-purple-500 border-purple-200 hover:bg-purple-100 hover:border-purple-500'
            : `${styles.bgClass} ${styles.textClass} border ${styles.borderClass}`
        }`}
        title="Click to toggle pass/fail"
      >
        {isGreen && <ThumbsUp className={`w-[12.8px] h-[12.8px] ${styles.iconClass}`} />}
        {isRed && <ThumbsDown className={`w-[12.8px] h-[12.8px] ${styles.iconClass}`} />}
        {isNeutral && <ThumbsUp className="w-[12.8px] h-[12.8px]" />}
      </button>
    );
  }

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
  columnIndex: number;
  modelId: string;
  metricView: 'grade' | 'tokens' | 'cost' | 'latency';
}

function SummaryCell({ cells, columnIndex, modelId, metricView }: SummaryCellProps) {
  // Filter cells for this column AND model_id, excluding errors and malformed
  // This prevents stale data when columns are edited or reordered
  const validCells = cells.filter(
    (c) => c.column_index === columnIndex && c.model_id === modelId && c.status === 'ok'
  );

  if (validCells.length === 0) {
    return <div className="text-xs text-neutral-400">—</div>;
  }

  // Calculate averages
  if (metricView === 'grade') {
    const avg = validCells.reduce((sum, c) => {
      // Use manual_grade if set, else fall back to graded_value
      const grade = c.manual_grade !== null ? c.manual_grade : (c.graded_value ?? 0);
      return sum + grade;
    }, 0) / validCells.length;
    return <div className="text-xs font-medium text-neutral-900 text-right">{formatGrade(avg)}</div>;
  }

  if (metricView === 'tokens') {
    const avgIn = validCells.reduce((sum, c) => sum + c.tokens_in, 0) / validCells.length;
    const avgOut = validCells.reduce((sum, c) => sum + c.tokens_out, 0) / validCells.length;
    return <div className="text-xs font-medium text-neutral-900 text-right">{formatTokens(Math.round(avgIn), Math.round(avgOut))}</div>;
  }

  if (metricView === 'cost') {
    const avg = validCells.reduce((sum, c) => sum + c.cost, 0) / validCells.length;
    return <div className="text-xs font-medium text-neutral-900 text-right">{formatCost(avg)}</div>;
  }

  if (metricView === 'latency') {
    const avg = validCells.reduce((sum, c) => sum + c.latency_ms, 0) / validCells.length;
    return <div className="text-xs font-medium text-neutral-900 text-right">{formatLatency(Math.round(avg))}</div>;
  }

  return <div className="text-xs text-neutral-400 text-right">—</div>;
}
