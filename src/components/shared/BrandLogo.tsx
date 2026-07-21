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
  sm: 28,
  md: 32,
  lg: 40,
};

/** Full wordmark target height; width follows aspect of tight logo (4:1). */
const FULL_H: Record<BrandLogoSize, number> = {
  xs: 22,
  sm: 26,
  md: 30,
  lg: 36,
};

const FULL_ASPECT = 4; // width / height for threadlearn-logo-tight.png (640×160)

export interface BrandLogoProps {
  variant?: BrandLogoVariant;
  size?: BrandLogoSize;
  className?: string;
  priority?: boolean;
  /** When true, wraps mark in a light rounded chip for contrast on dark surfaces. */
  onDark?: boolean;
}

export function BrandLogo({
  variant = 'full',
  size = 'md',
  className = '',
  priority = false,
  onDark = false,
}: BrandLogoProps) {
  if (variant === 'mark') {
    const px = MARK_PX[size];
    const image = (
      <Image
        src="/brand/threadlearn-mark.png"
        alt="ThreadLearn"
        width={px}
        height={px}
        priority={priority}
        className={`object-contain shrink-0 ${className}`.trim()}
      />
    );

    if (!onDark) return image;

    return (
      <span
        className={`inline-grid place-items-center rounded-lg bg-white shrink-0 ${className}`.trim()}
        style={{ width: px + 6, height: px + 6 }}
      >
        <Image
          src="/brand/threadlearn-mark.png"
          alt="ThreadLearn"
          width={px - 2}
          height={px - 2}
          priority={priority}
          className="object-contain"
        />
      </span>
    );
  }

  const h = FULL_H[size];
  const w = Math.round(h * FULL_ASPECT);

  return (
    <Image
      src="/brand/threadlearn-logo-tight.png"
      alt="ThreadLearn"
      width={w}
      height={h}
      priority={priority}
      className={`object-contain object-left shrink-0 ${className}`.trim()}
      style={{ width: w, height: h }}
    />
  );
}

export default BrandLogo;
