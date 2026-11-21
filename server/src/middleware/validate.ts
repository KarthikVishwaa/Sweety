import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError, type ErrorDetails } from '../lib/AppError.js';

export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details: ErrorDetails = {};
      for (const issue of result.error.issues) {
        details[issue.path.join('.')] ??= issue.message;
      }
      throw new AppError(
        400,
        'Please correct the highlighted fields.',
        'VALIDATION_ERROR',
        details,
      );
    }

    req.body = result.data;
    next();
  };
}
