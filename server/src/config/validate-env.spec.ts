import { validateEnvironment } from './validate-env';

describe('validateEnvironment', () => {
  const valid = {
    DATABASE_URL: 'postgresql://sums:test@localhost:5432/sums',
    JWT_ACCESS_SECRET: 'a-secret-value-that-is-at-least-32-characters',
  };

  it('normalizes token lifetimes to numbers so JWT expiresIn uses seconds', () => {
    expect(
      validateEnvironment({
        ...valid,
        ACCESS_TOKEN_TTL_SECONDS: '900',
        REFRESH_TOKEN_TTL_DAYS: '7',
      }),
    ).toMatchObject({ ACCESS_TOKEN_TTL_SECONDS: 900, REFRESH_TOKEN_TTL_DAYS: 7 });
  });

  it('rejects token lifetimes outside the approved bounds', () => {
    expect(() => validateEnvironment({ ...valid, ACCESS_TOKEN_TTL_SECONDS: '30' })).toThrow('ACCESS_TOKEN_TTL_SECONDS');
    expect(() => validateEnvironment({ ...valid, REFRESH_TOKEN_TTL_DAYS: '31' })).toThrow('REFRESH_TOKEN_TTL_DAYS');
  });
});
