import { pool } from '../../db/pool.js';
import { USER_COLUMNS } from '../auth/auth.repository.js';
import type { UserRecord } from '../auth/auth.types.js';
import type { UpdateMeInput } from './users.schemas.js';

// A field that is not sent is left as it is.
export async function updateProfile(
  userId: string,
  { name, gender, dateOfBirth }: UpdateMeInput,
): Promise<UserRecord | undefined> {
  const result = await pool.query<UserRecord>(
    `UPDATE users
     SET name = COALESCE($2, name),
         gender = COALESCE($3, gender),
         date_of_birth = COALESCE($4::date, date_of_birth)
     WHERE id = $1
     RETURNING ${USER_COLUMNS}`,
    [userId, name ?? null, gender ?? null, dateOfBirth ?? null],
  );
  return result.rows[0];
}
