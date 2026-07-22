import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format number with abbreviation (1000 → 1K) */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/** Build XP level from total XP (matches BE formula) */
export function getLevel(xp: number): number {
  return Math.floor(xp / 1000) + 1;
}

/** XP remaining until next level */
export function xpToNextLevel(xp: number): number {
  return 1000 - (xp % 1000);
}

/** Level progress percentage */
export function levelProgress(xp: number): number {
  return ((xp % 1000) / 1000) * 100;
}

/**
 * Recover UTF-8 text that was decoded as Latin-1 by an upstream service.
 * Proper Unicode strings are returned unchanged.
 */
export function normalizeMojibakeText(value: string): string {
  if (!/(?:Ã.|Â.|Ä.|Å.|á[\u0080-\u00bf])/.test(value)) return value;

  try {
    return new TextDecoder('utf-8').decode(
      Uint8Array.from(value, (character) => character.charCodeAt(0)),
    );
  } catch {
    return value;
  }
}
