'use client';

import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/shared/BrandLogo';

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
        <Link
          href="/"
          className="public-brand-logo mb-8 inline-flex items-center justify-center"
          aria-label="ThreadLearn home"
        >
          <BrandLogo variant="full" size="lg" priority />
        </Link>

        <div className="rounded-2xl border border-black/10 bg-white p-6 panel-shadow">
          {children}
        </div>

        {footer ? <div className="mt-5 text-center text-sm text-ink-faint">{footer}</div> : null}
      </div>
    </div>
  );
}
