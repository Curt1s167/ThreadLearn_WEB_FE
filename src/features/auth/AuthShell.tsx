'use client';

import React from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';

/**
 * PR5 — shared light auth chrome (cream canvas + white card).
 * Does not touch authService / form handlers.
 */
export function AuthShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas-cream text-ink flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2.5 mb-8 justify-center">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-black text-white">
            <Zap size={16} />
          </span>
          <span className="font-semibold text-lg tracking-tight text-ink">ThreadLearn</span>
        </Link>

        <div className="rounded-2xl border border-black/10 bg-white p-6 panel-shadow">
          {children}
        </div>

        {footer ? <div className="mt-5 text-center text-sm text-ink-faint">{footer}</div> : null}
      </div>
    </div>
  );
}
