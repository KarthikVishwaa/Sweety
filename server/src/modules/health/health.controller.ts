import type { Request, Response } from 'express';
import { pool } from '../../db/pool.js';
import { logger } from '../../lib/logger.js';

async function isDatabaseReachable(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    logger.warn({ err: error }, 'Database ping failed');
    return false;
  }
}

export async function getHealth(_req: Request, res: Response) {
  const databaseUp = await isDatabaseReachable();

  res.status(databaseUp ? 200 : 503).json({
    status: databaseUp ? 'ok' : 'degraded',
    db: databaseUp ? 'up' : 'down',
  });
}
