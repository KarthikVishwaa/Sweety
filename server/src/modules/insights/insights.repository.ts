import { pool } from '../../db/pool.js';
import { SLOT_KEYS } from '../readings/readings.constants.js';
import type { ReadingSlot } from '../readings/readings.types.js';
import type { DateRange } from '../reports/reports.types.js';
import { GLUCOSE_THRESHOLDS, RECENT_READINGS } from './insights.constants.js';

export interface MonthStats {
  count: number;
  average: number | null;
  highest: number | null;
  lowest: number | null;
  low: number;
  high: number;
}

export interface SlotAverage {
  slot: ReadingSlot;
  average: number;
  count: number;
}

export interface ExtremeReading {
  kind: 'highest' | 'lowest';
  value: number;
  date: string;
  slot: ReadingSlot;
}

export interface RecentRow {
  id: string;
  date: string;
  slot: ReadingSlot;
  value: number;
}

export async function monthStats(userId: string, { from, to }: DateRange): Promise<MonthStats> {
  const result = await pool.query<MonthStats>(
    `SELECT COUNT(*)::int AS count,
            ROUND(AVG(value)::numeric, 1)::float8 AS average,
            MAX(value)::int AS highest,
            MIN(value)::int AS lowest,
            COUNT(*) FILTER (WHERE value < $4)::int AS low,
            COUNT(*) FILTER (WHERE value > $5)::int AS high
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [userId, from, to, GLUCOSE_THRESHOLDS.low, GLUCOSE_THRESHOLDS.high],
  );
  return result.rows[0] as MonthStats;
}

export async function slotAverages(
  userId: string,
  { from, to }: DateRange,
): Promise<SlotAverage[]> {
  const result = await pool.query<SlotAverage>(
    `SELECT slot,
            ROUND(AVG(value)::numeric, 1)::float8 AS average,
            COUNT(*)::int AS count
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
     GROUP BY slot`,
    [userId, from, to],
  );
  return result.rows;
}

// Ties go to the earliest date, then the earliest slot of the day.
export async function extremeReadings(
  userId: string,
  { from, to }: DateRange,
): Promise<ExtremeReading[]> {
  const result = await pool.query<ExtremeReading>(
    `(SELECT 'highest' AS kind, value, reading_date AS date, slot
      FROM readings
      WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
      ORDER BY value DESC, reading_date, array_position($4::text[], slot)
      LIMIT 1)
     UNION ALL
     (SELECT 'lowest' AS kind, value, reading_date AS date, slot
      FROM readings
      WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
      ORDER BY value ASC, reading_date, array_position($4::text[], slot)
      LIMIT 1)`,
    [userId, from, to, SLOT_KEYS],
  );
  return result.rows;
}

export async function recentReadings(userId: string): Promise<RecentRow[]> {
  const result = await pool.query<RecentRow>(
    `SELECT id, reading_date AS date, slot, value
     FROM readings
     WHERE user_id = $1
     ORDER BY reading_date DESC, array_position($2::text[], slot) DESC
     LIMIT $3`,
    [userId, SLOT_KEYS, RECENT_READINGS],
  );
  return result.rows;
}

export async function lifetime(
  userId: string,
): Promise<{ totalReadings: number; firstReadingDate: string | null }> {
  const result = await pool.query<{ totalReadings: number; firstReadingDate: string | null }>(
    `SELECT COUNT(*)::int AS "totalReadings", MIN(reading_date) AS "firstReadingDate"
     FROM readings
     WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0] as { totalReadings: number; firstReadingDate: string | null };
}
