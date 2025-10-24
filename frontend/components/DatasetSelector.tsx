// ABOUTME: Dropdown to select dataset; click name to preview first 50 rows
// ABOUTME: Shows row count; includes upload CSV/JSON button

'use client';

import { useState } from 'react';
import { Dataset } from '@/lib/types';
import { DatasetPreviewModal } from './DatasetPreviewModal';
import { DatasetUpload } from './DatasetUpload';

interface DatasetSelectorProps {
  datasets: Dataset[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpload?: (name: string, headers: string[], rows: Record<string, string>[]) => void;
}

export function DatasetSelector({ datasets, selectedId, onSelect, onUpload }: DatasetSelectorProps) {
  const [previewDatasetId, setPreviewDatasetId] = useState<string | null>(null);

  const selectedDataset = selectedId ? datasets.find((d) => d.id === selectedId) : null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Dataset</label>
      <select
        value={selectedId || ''}
        onChange={(e) => onSelect(e.target.value || null)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
      >
        <option value="">No dataset</option>
        {datasets.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} ({d.row_count} rows)
          </option>
        ))}
      </select>

      {onUpload && <DatasetUpload onUpload={onUpload} />}

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
