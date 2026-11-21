import { pool } from '../../db/pool.js';
import type { NewUser, UserRecord } from './auth.types.js';

const USER_COLUMNS =
  'id, name, email, password_hash AS "passwordHash", role, date_of_birth AS "dateOfBirth"';

export async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  const result = await pool.query<UserRecord>(
    `SELECT ${USER_COLUMNS} FROM users WHERE lower(email) = lower($1)`,
    [email],
  );
  return result.rows[0];
}

export async function findUserById(id: string): Promise<UserRecord | undefined> {
  const result = await pool.query<UserRecord>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [
    id,
  ]);
  return result.rows[0];
}

export async function insertUser({
  name,
  email,
  passwordHash,
  dateOfBirth,
}: NewUser): Promise<UserRecord> {
  const result = await pool.query<UserRecord>(
    `INSERT INTO users (name, email, password_hash, date_of_birth) VALUES ($1, $2, $3, $4)
     RETURNING ${USER_COLUMNS}`,
    [name, email, passwordHash, dateOfBirth],
  );
  return result.rows[0] as UserRecord;
}
