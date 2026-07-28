/**
 * Notification links are server-provided. Only allow same-app absolute paths;
 * protocol-relative URLs, backslashes and schemes must never reach router.push.
 */
export const isSafeInternalPath = (value?: string): value is string => {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return false;
  }
  try {
    const parsed = new URL(value, 'https://threadlearn.local');
    return parsed.origin === 'https://threadlearn.local';
  } catch {
    return false;
  }
};
