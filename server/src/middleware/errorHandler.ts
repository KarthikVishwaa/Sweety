import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/AppError.js';
import { logger } from '../lib/logger.js';

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  const type = (error as { type?: string } | null)?.type;
  if (type === 'entity.too.large')
    return new AppError(413, 'Request body too large', 'PAYLOAD_TOO_LARGE');
  if (type === 'entity.parse.failed')
    return new AppError(400, 'Malformed JSON body', 'INVALID_JSON');

  return new AppError(500, 'Internal server error', 'INTERNAL_ERROR');
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  const appError = toAppError(error);

  if (appError.statusCode >= 500) {
    logger.error({ err: error, method: req.method, url: req.originalUrl }, 'Unhandled error');
  }

  res.status(appError.statusCode).json({
    error: { message: appError.message, code: appError.code, details: appError.details },
  });
}
