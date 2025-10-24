// ABOUTME: Run button - triggers prompt execution against dataset
// ABOUTME: Disabled while run is active; shows loading state with spinner

'use client';

import { useState, useEffect } from 'react';

interface RunButtonProps {
  isLoading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function RunButton({ isLoading = false, disabled = false, onClick }: RunButtonProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`w-full px-4 py-2 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
        disabled || isLoading
          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
          : 'bg-primary text-white hover:bg-opacity-90 active:bg-opacity-80'
      }`}
    >
      {isLoading ? (
        <>
          <svg
            className="w-4 h-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading…</span>
        </>
      ) : (
        <span>Run</span>
      )}
    </button>
  );
}
