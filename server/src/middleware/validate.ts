import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { parseWithSchema } from '../lib/parseWithSchema.js';

interface ValidateOptions {
  firstIssueOnly?: boolean;
}

export function validate(schema: ZodType, options: ValidateOptions = {}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = parseWithSchema(schema, req.body, options);
    next();
  };
}
