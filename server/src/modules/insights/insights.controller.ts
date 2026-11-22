import type { Request, Response } from 'express';
import { parseWithSchema } from '../../lib/parseWithSchema.js';
import { insightsQuerySchema } from './insights.schemas.js';
import { buildInsights } from './insights.service.js';

export async function getInsights(req: Request, res: Response) {
  const { month } = parseWithSchema(insightsQuerySchema, req.query, { firstIssueOnly: true });
  const userId = (req.user as NonNullable<Request['user']>).id;
  res.json(await buildInsights(userId, month));
}
