// ABOUTME: File upload input for CSV/JSON dataset import
// ABOUTME: Parses file, shows toast on success/error, calls onCreate

'use client';

import { useRef, useState } from 'react';
import { parseDatasetFile } from '@/lib/csvParser';

interface DatasetUploadProps {
  onUpload: (name: string, headers: string[], rows: Record<string, string>[], rowCount: number) => void;
}

export function DatasetUpload({ onUpload }: DatasetUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const result = parseDatasetFile(text, file.name);

      // Generate dataset name from filename
      const datasetName = file.name.replace(/\.(csv|json)$/, '');

      onUpload(datasetName, result.headers, result.rows, result.rowCount);
      showToast('success', `Uploaded "${datasetName}" with ${result.rowCount} rows`);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse file';
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json"
        onChange={handleFileSelect}
        disabled={loading}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="w-full px-3 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
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
    </div>
  );
}
