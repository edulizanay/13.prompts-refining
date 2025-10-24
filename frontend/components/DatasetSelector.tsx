// ABOUTME: Dropdown to select dataset; click name to preview first 50 rows
// ABOUTME: Shows row count; includes upload CSV/JSON button (Prompt 4)

'use client';

import { useState } from 'react';
import { Dataset } from '@/lib/types';
import { DatasetPreviewModal } from './DatasetPreviewModal';

interface DatasetSelectorProps {
  datasets: Dataset[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function DatasetSelector({ datasets, selectedId, onSelect }: DatasetSelectorProps) {
  const [previewDatasetId, setPreviewDatasetId] = useState<string | null>(null);

  const selectedDataset = selectedId ? datasets.find((d) => d.id === selectedId) : null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Dataset</label>
      <div className="flex gap-2">
        <select
          value={selectedId || ''}
          onChange={(e) => onSelect(e.target.value || null)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        >
          <option value="">No dataset</option>
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.row_count} rows)
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            // Placeholder for upload (Prompt 4)
          }}
          className="px-3 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled
          title="Upload coming in Prompt 4"
        >
          Upload
        </button>
      </div>

      {selectedDataset && (
        <button
          onClick={() => setPreviewDatasetId(selectedDataset.id)}
          className="text-sm text-primary hover:underline"
        >
          Preview ({selectedDataset.row_count} rows)
        </button>
      )}

      {previewDatasetId && (
        <DatasetPreviewModal
          datasetId={previewDatasetId}
          onClose={() => setPreviewDatasetId(null)}
        />
      )}
    </div>
  );
}
