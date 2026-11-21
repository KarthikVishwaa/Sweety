import { pool } from '../../db/pool.js';

export interface ReadingFixture {
  date: string;
  slot: string;
  value: number;
}

export async function resetDatabase() {
  await pool.query('TRUNCATE users CASCADE');
}

export async function insertReadings(email: string, readings: ReadingFixture[]) {
  await pool.query(
    `INSERT INTO readings (user_id, reading_date, slot, value)
     SELECT (SELECT id FROM users WHERE lower(email) = lower($1)), reading_date, slot, value
     FROM unnest($2::date[], $3::text[], $4::int[]) AS fixture(reading_date, slot, value)`,
    [
      email,
      readings.map((reading) => reading.date),
      readings.map((reading) => reading.slot),
      readings.map((reading) => reading.value),
    ],
  );
}
