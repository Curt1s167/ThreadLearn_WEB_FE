import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useUIStore } from '../../store';

interface ModalProps {
  name:         string;
  title?:       string;
  description?: string;
  children:     React.ReactNode;
  size?:        'sm' | 'md' | 'lg' | 'xl';
  onClose?:     () => void;
}

const sizeMap = {
  sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  name, title, description, children, size = 'md', onClose,
}) => {
  const { activeModal, closeModal } = useUIStore();
  const isOpen = activeModal === name;

  const handleClose = () => {
    closeModal();
    onClose?.();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handler);
    // Prevent body scroll when modal is open
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.97, y: 8  }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={`relative w-full ${sizeMap[size]} bg-[#111118] border border-white/[0.08] rounded-2xl panel-shadow`}
          >
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
                  aria-label="Đóng"
                  className="text-gray-600 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-white/5"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────
export const ConfirmModal: React.FC<{
  name:          string;
  title:         string;
  description:   string;
  onConfirm:     () => void;
  confirmLabel?: string;
  danger?:       boolean;
}> = ({ name, title, description, onConfirm, confirmLabel = 'Xác nhận', danger = false }) => {
  const { closeModal } = useUIStore();

  return (
    <Modal name={name} title={title} description={description} size="sm">
      <div className="flex gap-3 justify-end mt-2">
        <button onClick={closeModal} className="btn-ghost text-sm font-mono">
          Hủy
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
