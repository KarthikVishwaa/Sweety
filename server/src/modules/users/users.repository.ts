import { pool } from '../../db/pool.js';
import { USER_COLUMNS } from '../auth/auth.repository.js';
import type { Gender, UserRecord } from '../auth/auth.types.js';

export async function updateGender(
  userId: string,
  gender: Gender,
): Promise<UserRecord | undefined> {
  const result = await pool.query<UserRecord>(
    `UPDATE users SET gender = $2 WHERE id = $1 RETURNING ${USER_COLUMNS}`,
    [userId, gender],
  );
  return result.rows[0];
}
