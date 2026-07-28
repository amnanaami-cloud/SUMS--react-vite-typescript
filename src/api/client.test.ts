import { afterEach, describe, expect, it, vi } from 'vitest';
import { authApi } from './auth';
import { apiRequest, setAccessToken } from './client';

const user = {
  id: 'user-1',
  email: 'student@up.edu.ps',
  universityId: '2202100054',
  employeeId: null,
  nameEn: 'Layla Nassar',
  nameAr: 'ليلى نصار',
  preferredLanguage: 'en',
  roles: ['student'] as const,
  activeRole: 'student' as const,
  permissions: ['dashboard.read'],
  studentProfile: null,
  employeeProfile: null,
};

describe('API authentication client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setAccessToken(null);
  });

  it('keeps the access token in memory and attaches it to later requests', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { accessToken: 'access-token', expiresIn: 900, user } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: user }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { stats: {} } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await authApi.login('student@up.edu.ps', 'SumsDemo!2026', 'student');
    await apiRequest('/dashboard');

    const headers = new Headers(fetchMock.mock.calls[2][1]?.headers);
    expect(headers.get('Authorization')).toBe('Bearer access-token');
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/me');
    expect(fetchMock.mock.calls[0][1]?.credentials).toBe('include');
  });

  it('returns a typed error without exposing an upstream body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials', details: [] }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    await expect(authApi.login('bad@example.com', 'wrong', 'student')).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
    });
  });
});
