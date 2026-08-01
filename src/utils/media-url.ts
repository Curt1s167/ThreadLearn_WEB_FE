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
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      // Older local records may have stored an uploads URL against the Next.js
      // dev server. Uploaded files are served by the API, never by port 3001.
      if (
        /^\/uploads\//.test(parsed.pathname) &&
        (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
      ) {
        return `${getBackendOrigin()}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      // Let the browser handle a malformed absolute URL as it did before.
    }
    return value;
  }

  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${getBackendOrigin()}${normalizedPath}`;
}
