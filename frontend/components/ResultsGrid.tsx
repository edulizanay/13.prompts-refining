// ABOUTME: Results grid - displays cells in a table layout with models as columns
// ABOUTME: Rows are dataset rows or single row for live execution

'use client';

import { useEffect, useState } from 'react';
import { Run, Cell, Dataset } from '@/lib/types';
import { ResultCell } from './ResultCell';
import { getCellsByRunId, getModelById } from '@/lib/mockRepo.temp';

interface ResultsGridProps {
  run: Run;
  dataset: Dataset | null;
}

export function ResultsGrid({ run, dataset }: ResultsGridProps) {
  const [cells, setCells] = useState<Cell[]>([]);
  const [, setUpdateTrigger] = useState(0);

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
                      <ResultCell cell={cell} />
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
    </div>
  );
}
