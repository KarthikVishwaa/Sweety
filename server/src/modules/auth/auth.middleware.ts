import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../lib/AppError.js';
import { AUTH_COOKIE_NAME } from './auth.cookie.js';
import { getUser } from './auth.service.js';
import { verifyAuthToken } from './auth.tokens.js';

const unauthenticated = () => new AppError(401, 'Authentication required.', 'UNAUTHENTICATED');

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token: unknown = req.cookies?.[AUTH_COOKIE_NAME];
  if (typeof token !== 'string') throw unauthenticated();

  const verified = verifyAuthToken(token);
  if (!verified) throw unauthenticated();

  const user = await getUser(verified.userId);
  if (!user) throw unauthenticated();

  req.user = user;
  next();
}
