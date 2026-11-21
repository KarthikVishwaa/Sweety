import { pool } from '../../db/pool.js';
import { USER_COLUMNS } from '../auth/auth.repository.js';
import type { BodyModel, UserRecord } from '../auth/auth.types.js';

export async function updateBodyModel(
  userId: string,
  bodyModel: BodyModel,
): Promise<UserRecord | undefined> {
  const result = await pool.query<UserRecord>(
    `UPDATE users SET body_model = $2 WHERE id = $1 RETURNING ${USER_COLUMNS}`,
    [userId, bodyModel],
  );
  return result.rows[0];
}
