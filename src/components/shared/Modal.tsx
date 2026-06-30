'use client';

import React, { useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { useUIStore } from '../../store';

interface ModalProps {
  name: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClose?: () => void;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  name,
  title,
  description,
  children,
  size = 'md',
  onClose,
}) => {
  const { activeModal, closeModal } = useUIStore();
  const isOpen = activeModal === name;

  const handleClose = useCallback(() => {
    closeModal();
    onClose?.();
  }, [closeModal, onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      {/* Panel */}
      <div
        className={`relative w-full ${sizeMap[size]} bg-[#111118] border border-white/[0.08] rounded-2xl panel-shadow animate-slide-in`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-start justify-between p-5 border-b border-white/[0.06]">
            <div>
              <h2 className="font-mono font-semibold text-gray-100">{title}</h2>
              {description && (
                <p className="text-sm text-gray-500 mt-0.5 font-mono">{description}</p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="text-gray-600 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-white/5"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {/* Body */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────
export const ConfirmModal: React.FC<{
  name: string;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmLabel?: string;
  danger?: boolean;
}> = ({ name, title, description, onConfirm, confirmLabel = 'Confirm', danger = false }) => {
  const { closeModal } = useUIStore();

  return (
    <Modal name={name} title={title} description={description} size="sm">
      <div className="flex gap-3 justify-end mt-2">
        <button
          onClick={closeModal}
          className="btn-ghost text-sm font-mono"
        >
          Cancel
        </button>
        <button
          onClick={() => { onConfirm(); closeModal(); }}
          className={`px-4 py-2 rounded-lg text-sm font-mono font-medium transition-colors ${
            danger
              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
              : 'bg-violet-600 hover:bg-violet-500 text-white'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
