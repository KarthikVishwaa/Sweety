import type { Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';

// The config reads .env every time it is imported, which would put COOKIE_SECURE back after a test unsets it.
vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));

async function cookieOptionsUnder(env: { NODE_ENV: string; COOKIE_SECURE?: string }) {
  vi.stubEnv('NODE_ENV', env.NODE_ENV);
  vi.stubEnv('COOKIE_SECURE', env.COOKIE_SECURE);
  vi.resetModules();

  const { setAuthCookie } = await import('../modules/auth/auth.cookie.js');
  const res = { cookie: vi.fn() } as unknown as Response;
  setAuthCookie(res, 'token', 900_000);
  return vi.mocked(res.cookie).mock.calls[0]?.[2];
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('auth cookie secure flag', () => {
  it('is secure when COOKIE_SECURE=true', async () => {
    expect(
      await cookieOptionsUnder({ NODE_ENV: 'development', COOKIE_SECURE: 'true' }),
    ).toMatchObject({
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    });
  });

  it('is not secure when COOKIE_SECURE=false, even in production', async () => {
    const options = await cookieOptionsUnder({ NODE_ENV: 'production', COOKIE_SECURE: 'false' });

    expect(options).toMatchObject({ secure: false, httpOnly: true });
  });

  it('defaults to secure in production', async () => {
    expect(await cookieOptionsUnder({ NODE_ENV: 'production' })).toMatchObject({ secure: true });
  });

  it('defaults to not secure outside production', async () => {
    expect(await cookieOptionsUnder({ NODE_ENV: 'development' })).toMatchObject({ secure: false });
  });

  it('rejects a value that is not a boolean', async () => {
    vi.stubEnv('COOKIE_SECURE', 'maybe');
    vi.resetModules();

    await expect(import('../config/env.js')).rejects.toThrow('COOKIE_SECURE');
  });
});
