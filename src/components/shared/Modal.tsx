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
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div
        className={`relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden ${sizeMap[size]} bg-white border border-black/10 rounded-2xl panel-shadow animate-slide-in`}
      >
        {title && (
          <div className="flex shrink-0 items-start justify-between p-5 border-b border-black/10">
            <div>
              <h2 className="font-semibold text-ink">{title}</h2>
              {description && (
                <p className="text-sm text-ink-muted mt-0.5">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-ink-faint hover:text-ink transition-colors p-1 rounded-lg hover:bg-black/[0.05]"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="min-h-0 overflow-y-auto overscroll-contain p-5">{children}</div>
      </div>
    </div>
  );
};

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
        <button type="button" onClick={closeModal} className="btn-ghost text-sm">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            closeModal();
          }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            danger
              ? 'bg-rose-500/10 hover:bg-rose-500/15 text-rose-700 border border-rose-500/20'
              : 'bg-black hover:bg-black/85 text-white'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
