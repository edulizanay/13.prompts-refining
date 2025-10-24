// ABOUTME: Main page - two-panel layout (Editor left, Results right)
// ABOUTME: Wires state management and orchestrates component rendering

'use client';

import { useEffect, useState } from 'react';
import { initializeSeedData } from '@/lib/mockRepo.temp';
import { EditorPanel } from '@/components/EditorPanel';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initialize seed data on first load
    initializeSeedData();
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Left Panel: Editor (40%) */}
      <div className="w-2/5 border-r border-accent-dark p-6 overflow-y-auto">
        <EditorPanel />
      </div>

      {/* Right Panel: Results (60%) */}
      <div className="w-3/5 p-6 overflow-y-auto">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Results</h1>
          <p className="text-gray-500">Results grid coming soon...</p>
        </div>
      </div>
    </div>
  );
}
