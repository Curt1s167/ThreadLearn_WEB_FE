const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

function getBackendOrigin(): string {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return 'http://localhost:5000';
  }
}

export function normalizeMediaUrl(
  url?: string | null
): string | undefined {
  const value = url?.trim();

  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;

  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${getBackendOrigin()}${normalizedPath}`;
}
