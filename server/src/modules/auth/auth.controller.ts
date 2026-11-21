import type { Request, Response } from 'express';
import { clearAuthCookie, setAuthCookie } from './auth.cookie.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';
import * as authService from './auth.service.js';

export async function register(req: Request, res: Response) {
  const { user, token, maxAgeMs } = await authService.register(req.body as RegisterInput);
  setAuthCookie(res, token, maxAgeMs);
  res.status(201).json({ user });
}

export async function login(req: Request, res: Response) {
  const { user, token, maxAgeMs } = await authService.login(req.body as LoginInput);
  setAuthCookie(res, token, maxAgeMs);
  res.json({ user });
}

export function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  res.status(204).end();
}

export function me(req: Request, res: Response) {
  res.json({ user: req.user });
}
