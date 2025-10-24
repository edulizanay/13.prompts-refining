// ABOUTME: Dataset selection, upload, and preview functionality
// ABOUTME: Handles CSV/JSON parsing, displays available datasets, and dataset preview modal

'use client';

import { useState, useRef, useEffect } from 'react';
import { Dataset } from '@/lib/types';
import { parseDatasetFile } from '@/lib/utils';
import { getAllDatasets, createDataset, getDatasetById } from '@/lib/mockRepo.temp';

interface DatasetSelectorProps {
  selectedDatasetId: string | null;
  onDatasetSelected: (datasetId: string | null) => void;
}

export function DatasetSelector({ selectedDatasetId, onDatasetSelected }: DatasetSelectorProps) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [mounted, setMounted] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [previewDatasetId, setPreviewDatasetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load datasets on mount
  useEffect(() => {
    const allDatasets = getAllDatasets();
    setDatasets(allDatasets);
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
      setDatasets(getAllDatasets());
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
      <label className="block text-sm font-medium text-gray-700">Dataset</label>
      <select
        value={selectedDatasetId || ''}
        onChange={(e) => onDatasetSelected(e.target.value || null)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
      >
        <option value="">No dataset</option>
        {datasets.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} ({d.row_count} rows)
          </option>
        ))}
      </select>

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
        className="w-full px-3 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {uploadLoading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Uploading...
          </>
        ) : (
          'Upload Dataset (CSV/JSON)'
        )}
      </button>

      {toast && (
        <div
          className={`p-3 rounded-md text-sm ${
            toast.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {toast.message}
        </div>
      )}

      {selectedDataset && (
        <button
          onClick={() => setPreviewDatasetId(selectedDataset.id)}
          className="text-sm text-primary hover:underline"
        >
          Preview ({selectedDataset.row_count} rows)
        </button>
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
