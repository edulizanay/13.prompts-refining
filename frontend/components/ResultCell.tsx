// ABOUTME: Individual result cell - displays prompt output with loading state
// ABOUTME: Shows status badges, error/malformed indicators, and truncated output

'use client';

import { Cell } from '@/lib/types';
import { truncate } from '@/lib/utils';

interface ResultCellProps {
  cell: Cell;
}

export function ResultCell({ cell }: ResultCellProps) {
  const isLoading = cell.status === 'running' || cell.status === 'idle';
  const isError = cell.status === 'error';
  const isMalformed = cell.status === 'malformed';

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

  const displayText = cell.output_parsed || cell.output_raw || '(No output)';
  const truncatedText = truncate(displayText, 200);

  return (
    <div
      className={`p-3 rounded-md border min-h-[100px] overflow-hidden ${
        isError
          ? 'bg-red-50 border-red-200'
          : isMalformed
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-white border-gray-200'
      }`}
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
          {isError && cell.error_message ? (
            <span className="text-red-600">{cell.error_message}</span>
          ) : (
            truncatedText
          )}
        </div>
      </div>
    </div>
  );
}
