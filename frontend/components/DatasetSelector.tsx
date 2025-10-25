// ABOUTME: Dataset selection, upload, and preview functionality
// ABOUTME: Handles CSV/JSON parsing, displays available datasets, and dataset preview modal

'use client';

import { useState, useEffect } from 'react';
import { getDatasetById } from '@/lib/mockRepo.temp';
import { Modal } from '@/components/ui/modal';

interface DatasetSelectorProps {
  selectedDatasetId: string | null;
  onDatasetSelected: (datasetId: string | null) => void;
}

export function DatasetSelector({ selectedDatasetId }: DatasetSelectorProps) {
  const [mounted, setMounted] = useState(false);
  const [previewDatasetId, setPreviewDatasetId] = useState<string | null>(null);

  // Load on mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedDataset = selectedDatasetId ? getDatasetById(selectedDatasetId) : null;
  const previewDataset = previewDatasetId ? getDatasetById(previewDatasetId) : null;

  if (!mounted) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        {selectedDataset && (
          <button
            onClick={() => setPreviewDatasetId(selectedDataset.id)}
            className="px-3 py-1 text-xs font-medium text-primary hover:bg-primary hover:bg-opacity-10 rounded"
          >
            Preview
          </button>
        )}
      </div>

      {selectedDataset && (
        <div className="text-xs text-gray-500">
          Selected: <span className="font-medium">{selectedDataset.name}</span> ({selectedDataset.row_count} rows)
        </div>
      )}

      {/* Dataset Preview Modal */}
      <Modal
        isOpen={previewDataset !== null}
        onClose={() => setPreviewDatasetId(null)}
        size="large"
        hasBackdropClose={true}
        hasEscapeClose={true}
        className="max-h-96 flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{previewDataset?.name} Preview</h3>
          <button
            onClick={() => setPreviewDatasetId(null)}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                {previewDataset?.headers.map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left font-medium text-gray-700 border-b border-gray-200"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewDataset?.rows.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {previewDataset.headers.map((h) => (
                    <td key={h} className="px-4 py-2 border-b border-gray-200 text-gray-600">
                      {row[h]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2 border-t border-gray-200 text-xs text-gray-500">
          Showing {previewDataset?.rows.length} of {previewDataset?.row_count} rows
        </div>
      </Modal>
    </div>
  );
}
