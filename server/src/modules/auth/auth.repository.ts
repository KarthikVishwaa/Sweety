import { pool } from '../../db/pool.js';
import type { NewUser, UserRecord } from './auth.types.js';

export const USER_COLUMNS = `id, name, email, password_hash AS "passwordHash", role,
  date_of_birth AS "dateOfBirth", gender AS "gender"`;

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
  gender,
}: NewUser): Promise<UserRecord> {
  const result = await pool.query<UserRecord>(
    `INSERT INTO users (name, email, password_hash, date_of_birth, gender)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${USER_COLUMNS}`,
    [name, email, passwordHash, dateOfBirth, gender],
  );
  return result.rows[0] as UserRecord;
}
