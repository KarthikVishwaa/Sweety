import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { AppError } from '../lib/AppError.js';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

const tooManyRequests = (_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(429, 'Too many requests, please try again later', 'RATE_LIMITED'));
};

export const globalLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooManyRequests,
});

// Login and register get a much lower limit than the rest of the API, to slow down password guessing.
export const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  limit: 20,
  skip: () => env.NODE_ENV === 'test',
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooManyRequests,
});
