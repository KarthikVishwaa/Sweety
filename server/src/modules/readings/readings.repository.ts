import { pool } from '../../db/pool.js';
import { SLOT_KEYS } from './readings.constants.js';
import type { ReadingInput, ReadingRecord, ReadingSlot } from './readings.types.js';

const READING_COLUMNS = `id, reading_date AS date, slot, value,
  created_at AS "createdAt", updated_at AS "updatedAt"`;

export async function listByDate(userId: string, date: string): Promise<ReadingRecord[]> {
  const result = await pool.query<ReadingRecord>(
    `SELECT ${READING_COLUMNS} FROM readings
     WHERE user_id = $1 AND reading_date = $2
     ORDER BY array_position($3::text[], slot)`,
    [userId, date, SLOT_KEYS],
  );
  return result.rows;
}

export async function findById(userId: string, id: string): Promise<ReadingRecord | undefined> {
  const result = await pool.query<ReadingRecord>(
    `SELECT ${READING_COLUMNS} FROM readings WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return result.rows[0];
}

export async function countOnDate(
  userId: string,
  date: string,
  excludeId: string | null,
): Promise<number> {
  const result = await pool.query<{ count: number }>(
    `SELECT count(*)::int AS count FROM readings
     WHERE user_id = $1 AND reading_date = $2 AND ($3::uuid IS NULL OR id <> $3)`,
    [userId, date, excludeId],
  );
  return result.rows[0]?.count ?? 0;
}

export async function slotIsTaken(
  userId: string,
  date: string,
  slot: ReadingSlot,
  excludeId: string | null,
): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM readings
     WHERE user_id = $1 AND reading_date = $2 AND slot = $3 AND ($4::uuid IS NULL OR id <> $4)`,
    [userId, date, slot, excludeId],
  );
  return result.rowCount !== 0;
}

export async function insert(userId: string, input: ReadingInput): Promise<ReadingRecord> {
  const result = await pool.query<ReadingRecord>(
    `INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4)
     RETURNING ${READING_COLUMNS}`,
    [userId, input.date, input.slot, input.value],
  );
  return result.rows[0] as ReadingRecord;
}

export async function update(
  userId: string,
  id: string,
  input: ReadingInput,
): Promise<ReadingRecord | undefined> {
  const result = await pool.query<ReadingRecord>(
    `UPDATE readings SET reading_date = $3, slot = $4, value = $5, updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING ${READING_COLUMNS}`,
    [id, userId, input.date, input.slot, input.value],
  );
  return result.rows[0];
}

export async function remove(userId: string, id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM readings WHERE id = $1 AND user_id = $2', [
    id,
    userId,
  ]);
  return result.rowCount !== 0;
}
