import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Notification } from '../types';

type DisplayNameUser = {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
};

/** Prefer the editable profile fields over legacy display-name fields. */
export function getDisplayName(user?: DisplayNameUser | null): string {
  const name = [user?.firstName?.trim(), user?.lastName?.trim()]
    .filter(Boolean)
    .join(' ');

  return name || user?.name?.trim() || user?.email?.trim() || 'ThreadLearn user';
}

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

const WINDOWS_1252_BYTES = new Map<number, number>([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84],
  [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88],
  [0x2030, 0x89], [0x0160, 0x8a], [0x2039, 0x8b], [0x0152, 0x8c],
  [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93],
  [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b],
  [0x0153, 0x9c], [0x017e, 0x9e], [0x0178, 0x9f],
]);

const MOJIBAKE_SIGNATURE = /(?:\u00c2|\u00c3|\u00c4|\u00c5|\u00e1[\u00ba\u00bb]|\u00e2[\u0080-\u00bf])/;

function decodeMisreadUtf8(value: string): string | null {
  const bytes: number[] = [];

  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint <= 0xff) {
      bytes.push(codePoint);
      continue;
    }

    const windowsByte = WINDOWS_1252_BYTES.get(codePoint);
    if (windowsByte == null) return null;
    bytes.push(windowsByte);
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes));
  } catch {
    return null;
  }
}

/** Recover UTF-8 text decoded as Latin-1 or Windows-1252 upstream. */
export function normalizeMojibakeText(value: string): string {
  let result = value;

  for (let pass = 0; pass < 2 && MOJIBAKE_SIGNATURE.test(result); pass += 1) {
    const decoded = decodeMisreadUtf8(result);
    if (!decoded || decoded.includes('\ufffd') || decoded === result) break;
    result = decoded;
  }

  return result;
}

function notificationCourseTitle(notification: Pick<Notification, 'message' | 'metadata'>): string | null {
  const metadata = notification.metadata;
  for (const key of ['courseTitle', 'courseName', 'title']) {
    const candidate = metadata?.[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return normalizeMojibakeText(candidate.trim());
    }
  }

  const quotedTitle = notification.message.match(/["“]([^"”]+)["”]/)?.[1]?.trim();
  return quotedTitle ? normalizeMojibakeText(quotedTitle) : null;
}

/**
 * Enrollment records created before the encoding fix may already contain a
 * replacement character, which cannot be decoded losslessly. Rebuild only the
 * known system sentence and preserve the real course title from metadata/body.
 */
export function formatNotificationMessage(
  notification: Pick<Notification, 'type' | 'message' | 'metadata'>,
): string {
  if (notification.type === 'COURSE_ENROLLED') {
    const courseTitle = notificationCourseTitle(notification);
    return courseTitle
      ? `Bạn đã tham gia khóa học "${courseTitle}".`
      : 'Bạn đã tham gia khóa học.';
  }

  return normalizeMojibakeText(notification.message);
}
