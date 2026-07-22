import React from 'react';
import Image from 'next/image';

/**
 * ThreadLearn brand mark / wordmark.
 * - `full`: horizontal logo (T mark + wordmark). Use only where there is enough width.
 * - `mark`: square icon-only for collapsed sidebar, mobile chips, and small favicon-like spots.
 */
export type BrandLogoVariant = 'full' | 'mark';

type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg';

const MARK_PX: Record<BrandLogoSize, number> = {
  xs: 24,
  sm: 30,
  md: 34,
  lg: 42,
};

/** Full wordmark target height; width follows aspect of tight logo (4:1). */
const FULL_H: Record<BrandLogoSize, number> = {
  xs: 22,
  sm: 30,
  md: 34,
  lg: 40,
};

const FULL_ASPECT = 4; // width / height for threadlearn-logo-tight.png (640×160)

export interface BrandLogoProps {
  variant?: BrandLogoVariant;
  size?: BrandLogoSize;
  className?: string;
  priority?: boolean;
  /** Force the light contrast surface; otherwise it is applied automatically in dark mode. */
  onDark?: boolean;
}

export function BrandLogo({
  variant = 'full',
  size = 'md',
  className = '',
  priority = false,
  onDark = false,
}: BrandLogoProps) {
  const adaptiveSurface = onDark
    ? 'rounded-lg bg-[#edf7ef] px-2 py-1 ring-1 ring-black/5'
    : 'dark:rounded-lg dark:bg-[#edf7ef] dark:px-2 dark:py-1 dark:ring-1 dark:ring-white/10';

  if (variant === 'mark') {
    const px = MARK_PX[size];
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center ${adaptiveSurface} ${className}`.trim()}
      >
        <Image
          src="/brand/threadlearn-mark.png"
          alt="ThreadLearn"
          width={px}
          height={px}
          priority={priority}
          className="shrink-0 object-contain"
        />
      </span>
    );
  }

  const h = FULL_H[size];
  const w = Math.round(h * FULL_ASPECT);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${adaptiveSurface} ${className}`.trim()}
    >
      <Image
        src="/brand/threadlearn-logo-tight.png"
        alt="ThreadLearn"
        width={w}
        height={h}
        priority={priority}
        className="shrink-0 object-contain object-left"
        style={{ width: w, height: h }}
      />
    </span>
  );
}

export default BrandLogo;
