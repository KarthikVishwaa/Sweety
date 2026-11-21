import { pool } from '../../db/pool.js';
import { SLOT_KEYS } from '../readings/readings.constants.js';
import type { ReadingSlot } from '../readings/readings.types.js';
import type { DateRange, DaySummary, ReportStats } from './reports.types.js';

export async function aggregateStats(
  userId: string,
  { from, to }: DateRange,
): Promise<ReportStats> {
  const result = await pool.query<ReportStats>(
    `SELECT COUNT(*)::int AS count,
            MAX(value)::int AS highest,
            MIN(value)::int AS lowest,
            ROUND(AVG(value)::numeric, 1)::float8 AS average
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [userId, from, to],
  );
  return result.rows[0] as ReportStats;
}

export async function listDayReadings(
  userId: string,
  date: string,
): Promise<{ id: string; slot: ReadingSlot; value: number; date: string }[]> {
  const result = await pool.query(
    `SELECT id, slot, value, reading_date AS date
     FROM readings
     WHERE user_id = $1 AND reading_date = $2
     ORDER BY array_position($3::text[], slot)`,
    [userId, date, SLOT_KEYS],
  );
  return result.rows;
}

export async function summariseDays(
  userId: string,
  { from, to }: DateRange,
): Promise<DaySummary[]> {
  const result = await pool.query<DaySummary>(
    `SELECT reading_date AS date,
            ROUND(AVG(value)::numeric, 1)::float8 AS average,
            MIN(value)::int AS lowest,
            MAX(value)::int AS highest,
            COUNT(*)::int AS count
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
     GROUP BY reading_date
     ORDER BY reading_date`,
    [userId, from, to],
  );
  return result.rows;
}
