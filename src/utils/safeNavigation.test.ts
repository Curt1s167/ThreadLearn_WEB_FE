import { isSafeInternalPath } from './safeNavigation';

describe('isSafeInternalPath', () => {
  it.each(['/notifications', '/lessons/abc?tab=notes', '/ai/history/123'])(
    'allows same-app path %s',
    (path) => expect(isSafeInternalPath(path)).toBe(true),
  );

  it.each([
    'https://evil.example/phish',
    '//evil.example/phish',
    '/\\evil.example',
    'javascript:alert(1)',
    '',
  ])('rejects unsafe notification link %s', (path) => {
    expect(isSafeInternalPath(path)).toBe(false);
  });
});
