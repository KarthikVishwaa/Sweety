import type { CookieOptions, Response } from 'express';
import { env } from '../../config/env.js';

export const AUTH_COOKIE_NAME = 'sweety_token';

const baseOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
};

export function setAuthCookie(res: Response, token: string, maxAgeMs: number) {
  res.cookie(AUTH_COOKIE_NAME, token, { ...baseOptions, maxAge: maxAgeMs });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, baseOptions);
}
