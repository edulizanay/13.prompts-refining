// ABOUTME: Modal dialog wrapper - handles backdrop, escape key, outside click, focus management
// ABOUTME: Provides consistent modal behavior across the application

'use client';

import { useEffect, useRef, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'small' | 'medium' | 'large';
  hasBackdropClose?: boolean;
  hasEscapeClose?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  size = 'medium',
  hasBackdropClose = true,
  hasEscapeClose = true,
  className = '',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !hasEscapeClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasEscapeClose, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hasBackdropClose && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Size variants for the modal content
  const sizeClasses: Record<string, string> = {
    small: 'max-w-sm',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-lg shadow-lg w-full overflow-auto ${sizeClasses[size]} ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}
