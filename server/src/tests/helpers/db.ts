import { pool } from '../../db/pool.js';

export async function resetDatabase() {
  await pool.query('TRUNCATE users CASCADE');
}
