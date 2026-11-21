import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/AppError.js';

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, `Route not found: ${req.method} ${req.path}`, 'NOT_FOUND'));
}
