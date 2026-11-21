import type { Request, Response } from 'express';
import { parseWithSchema } from '../../lib/parseWithSchema.js';
import { reportQuerySchema } from './reports.schemas.js';
import { buildReport } from './reports.service.js';

export async function getReport(req: Request, res: Response) {
  const { type, date } = parseWithSchema(reportQuerySchema, req.query, { firstIssueOnly: true });
  const userId = (req.user as NonNullable<Request['user']>).id;
  res.json(await buildReport(userId, type, date));
}
