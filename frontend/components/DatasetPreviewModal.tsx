// ABOUTME: Modal dialog showing first 50 rows of dataset in a table
// ABOUTME: Scrollable; displays headers and sample data

'use client';

import { useEffect, useState } from 'react';
import { Dataset } from '@/lib/types';
import { getDatasetById } from '@/lib/mockRepo.temp';

interface DatasetPreviewModalProps {
  datasetId: string;
  onClose: () => void;
}

export function DatasetPreviewModal({ datasetId, onClose }: DatasetPreviewModalProps) {
  const [dataset, setDataset] = useState<Dataset | null>(null);

  useEffect(() => {
    const ds = getDatasetById(datasetId);
    setDataset(ds);
  }, [datasetId]);

  if (!dataset) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-h-96 max-w-4xl shadow-lg flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{dataset.name} Preview</h3>
          <button
            onClick={onClose}
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
                {dataset.headers.map((h) => (
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
              {dataset.rows.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {dataset.headers.map((h) => (
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
          Showing {dataset.rows.length} of {dataset.row_count} rows
        </div>
      </div>
    </div>
  );
}
