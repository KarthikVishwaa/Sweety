import type { ZodType } from 'zod';
import { AppError, type ErrorDetails } from './AppError.js';

interface ParseOptions {
  firstIssueOnly?: boolean;
}

export function parseWithSchema<T>(
  schema: ZodType<T>,
  data: unknown,
  options: ParseOptions = {},
): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  const issues = options.firstIssueOnly ? result.error.issues.slice(0, 1) : result.error.issues;
  const details: ErrorDetails = {};
  for (const issue of issues) {
    details[issue.path.join('.')] ??= issue.message;
  }

  const message = options.firstIssueOnly
    ? (issues[0]?.message ?? 'Invalid request.')
    : 'Please correct the highlighted fields.';
  throw new AppError(400, message, 'VALIDATION_ERROR', details);
}
