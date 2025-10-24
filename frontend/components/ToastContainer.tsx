// ABOUTME: Toast notification container - displays error/success messages
// ABOUTME: Listens to custom toast events and renders notifications

'use client';

import { useEffect, useState } from 'react';
import { Toast } from '@/lib/toast';

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { id, message, type, duration = 5000 } = customEvent.detail;

      const newToast: Toast = { id, message, type, duration };
      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    };

    window.addEventListener('toast', handleToast);
    return () => window.removeEventListener('toast', handleToast);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-2 rounded-md text-white text-sm font-medium shadow-lg animate-fade-in ${
            toast.type === 'error'
              ? 'bg-red-500'
              : toast.type === 'success'
                ? 'bg-green-500'
                : 'bg-blue-500'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
