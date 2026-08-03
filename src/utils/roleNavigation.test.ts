import { getPostLoginPath, getRoleHomePath } from './roleNavigation';

describe('role navigation', () => {
  it.each([
    ['STUDENT', '/dashboard'],
    ['INSTRUCTOR', '/instructor'],
    ['ADMIN', '/admin'],
  ] as const)('maps %s to %s', (role, path) => {
    expect(getRoleHomePath(role)).toBe(path);
  });

  it('uses only safe, non-auth return paths after login', () => {
    expect(getPostLoginPath('INSTRUCTOR', '/lessons/lesson-1')).toBe('/lessons/lesson-1');
    expect(getPostLoginPath('INSTRUCTOR', '/login')).toBe('/instructor');
    expect(getPostLoginPath('INSTRUCTOR', 'https://example.com')).toBe('/instructor');
  });
});
