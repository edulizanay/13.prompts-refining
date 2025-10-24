// ABOUTME: Simple toast notification manager for displaying errors and messages
// ABOUTME: Uses browser events to communicate with UI components

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

let toastId = 0;

export function createToast(message: string, type: ToastType = 'info', duration = 5000): string {
  const id = `toast_${toastId++}`;
  const event = new CustomEvent('toast', {
    detail: { id, message, type, duration },
  });
  window.dispatchEvent(event);
  return id;
}

export function showSuccessToast(message: string): string {
  return createToast(message, 'success');
}

export function showErrorToast(message: string): string {
  return createToast(message, 'error');
}

export function showInfoToast(message: string): string {
  return createToast(message, 'info');
}
