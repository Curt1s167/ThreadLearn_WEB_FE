import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownProps {
  trigger:   React.ReactNode;
  children:  React.ReactNode;
  align?:    'left' | 'right';
  width?:    string;
  className?: string;
}

/**
 * Accessible click-outside-aware dropdown with subtle scale+fade.
 * Trigger and panel are styled by the caller — Dropdown only handles layout + motion.
 */
export const Dropdown: React.FC<DropdownProps> = ({
  trigger, children, align = 'right', width = 'w-56', className,
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown',   onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown',   onEsc);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={`relative inline-block ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center"
      >
        {trigger}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{    opacity: 0, scale: 0.97, y: -2 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute z-40 mt-2 ${width} ${align === 'right' ? 'right-0' : 'left-0'}
                        bg-[#111118] border border-white/[0.08] rounded-xl shadow-2xl
                        overflow-hidden`}
            onClick={() => setOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const DropdownItem: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon?: React.ReactNode;
    danger?: boolean;
  }
> = ({ icon, danger, children, className, ...props }) => (
  <button
    role="menuitem"
    type="button"
    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-left
                transition-colors ${danger
                  ? 'text-rose-400 hover:bg-rose-500/10'
                  : 'text-gray-300 hover:text-gray-100 hover:bg-white/5'}
                ${className ?? ''}`}
    {...props}
  >
    {icon && <span className="shrink-0">{icon}</span>}
    {children}
  </button>
);

export const DropdownDivider: React.FC = () => (
  <div className="border-t border-white/[0.05] my-1" />
);
