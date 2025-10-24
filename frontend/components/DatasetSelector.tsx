// ABOUTME: Dataset selection, upload, and preview functionality
// ABOUTME: Handles CSV/JSON parsing, displays available datasets, and dataset preview modal

'use client';

import { useState, useRef, useEffect } from 'react';
import { parseDatasetFile } from '@/lib/utils';
import { createDataset, getDatasetById } from '@/lib/mockRepo.temp';

interface DatasetSelectorProps {
  selectedDatasetId: string | null;
  onDatasetSelected: (datasetId: string | null) => void;
}

export function DatasetSelector({ selectedDatasetId, onDatasetSelected }: DatasetSelectorProps) {
  const [mounted, setMounted] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [previewDatasetId, setPreviewDatasetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load on mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const text = await file.text();
      const result = parseDatasetFile(text, file.name);
      const dataset = createDataset(file.name.replace(/\.[^.]+$/, ''), result.headers, result.rows);
      onDatasetSelected(dataset.id);
      showToast('success', `Dataset "${dataset.name}" uploaded successfully`);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse dataset';
      showToast('error', message);
    } finally {
      setUploadLoading(false);
    }
  };

  const selectedDataset = selectedDatasetId ? getDatasetById(selectedDatasetId) : null;
  const previewDataset = previewDatasetId ? getDatasetById(previewDatasetId) : null;

  if (!mounted) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Dataset</label>
        <div className="flex gap-2 items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={handleFileSelect}
            disabled={uploadLoading}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadLoading}
            className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 rounded hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {uploadLoading ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></span>
              </>
            ) : (
              '+ Upload'
            )}
          </button>
          {selectedDataset && (
            <button
              onClick={() => setPreviewDatasetId(selectedDataset.id)}
              className="px-3 py-1 text-xs font-medium text-primary hover:bg-primary hover:bg-opacity-10 rounded"
            >
              Preview
            </button>
          )}
        </div>
      </div>

      {selectedDataset && (
        <div className="text-xs text-gray-500">
          Selected: <span className="font-medium">{selectedDataset.name}</span> ({selectedDataset.row_count} rows)
        </div>
      )}

      {toast && (
        <div
          className={`p-2 rounded-md text-xs ${
            toast.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Dataset Preview Modal */}
      {previewDataset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-h-96 max-w-4xl shadow-lg flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{previewDataset.name} Preview</h3>
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
                    {previewDataset.headers.map((h) => (
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
                  {previewDataset.rows.map((row, idx) => (
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
              Showing {previewDataset.rows.length} of {previewDataset.row_count} rows
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
