import type { Request, Response } from 'express';
import { parseWithSchema } from '../../lib/parseWithSchema.js';
import { listQuerySchema } from './readings.schemas.js';
import * as readingsService from './readings.service.js';
import type { ReadingInput } from './readings.types.js';

function currentUserId(req: Request): string {
  return (req.user as NonNullable<Request['user']>).id;
}

export async function list(req: Request, res: Response) {
  const { date } = parseWithSchema(listQuerySchema, req.query, { firstIssueOnly: true });
  res.json({ readings: await readingsService.listReadings(currentUserId(req), date) });
}

export async function create(req: Request, res: Response) {
  const reading = await readingsService.createReading(currentUserId(req), req.body as ReadingInput);
  res.status(201).json({ reading });
}

export async function update(req: Request, res: Response) {
  const reading = await readingsService.updateReading(
    currentUserId(req),
    String(req.params.id),
    req.body as ReadingInput,
  );
  res.json({ reading });
}

export async function remove(req: Request, res: Response) {
  await readingsService.deleteReading(currentUserId(req), String(req.params.id));
  res.status(204).end();
}
