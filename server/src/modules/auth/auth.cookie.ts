import type { CookieOptions, Response } from 'express';
import { env } from '../../config/env.js';

export const AUTH_COOKIE_NAME = 'sweety_token';

// httpOnly keeps the token away from page scripts, SameSite=Lax keeps the browser from sending it with
// cross-site POSTs, and Secure follows COOKIE_SECURE so a production build still runs over plain http locally.
const baseOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.COOKIE_SECURE,
  path: '/',
};

export function setAuthCookie(res: Response, token: string, maxAgeMs: number) {
  res.cookie(AUTH_COOKIE_NAME, token, { ...baseOptions, maxAge: maxAgeMs });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, baseOptions);
}
