import pg from 'pg';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  connectionTimeoutMillis: 3000,
});

pool.on('error', (error) => {
  logger.error({ err: error }, 'Unexpected error on idle database client');
});
