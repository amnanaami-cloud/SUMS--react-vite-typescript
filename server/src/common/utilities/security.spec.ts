import { sanitizeAuditValue } from './security';

describe('audit metadata sanitization', () => {
  it('removes secrets recursively without changing safe metadata', () => {
    expect(
      sanitizeAuditValue({
        action: 'LOGIN',
        password: 'never-store',
        nested: { refreshToken: 'never-store', reason: 'safe' },
        entries: [{ authorization: 'Bearer secret', result: 'SUCCESS' }],
      }),
    ).toEqual({ action: 'LOGIN', nested: { reason: 'safe' }, entries: [{ result: 'SUCCESS' }] });
  });
});
