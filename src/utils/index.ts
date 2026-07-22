import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format number with abbreviation (1000 to 1K) */
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
  const isLatin1Only = [...value].every((character) => (character.codePointAt(0) ?? 0) <= 0xff);
  const hasMojibakeSignature = /(?:\u00c3[\u0000-\u00ff]|\u00c2[\u0000-\u00ff]|\u00c4[\u0000-\u00ff]|\u00c5[\u0000-\u00ff]|\u00e1[\u0080-\u00bf])/.test(value);

  if (!isLatin1Only || !hasMojibakeSignature) return value;

  try {
    const decoded = new TextDecoder('utf-8').decode(
      Uint8Array.from(value, (character) => character.charCodeAt(0)),
    );
    return decoded.includes('\ufffd') ? value : decoded;
  } catch {
    return value;
  }
}
