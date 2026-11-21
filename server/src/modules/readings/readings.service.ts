import pg from 'pg';
import { AppError } from '../../lib/AppError.js';
import { MAX_READINGS_PER_DAY, READING_MESSAGES, SLOT_LABELS } from './readings.constants.js';
import * as readingsRepository from './readings.repository.js';
import { readingIdSchema } from './readings.schemas.js';
import type { Reading, ReadingInput, ReadingRecord, ReadingSlot } from './readings.types.js';

const UNIQUE_VIOLATION = '23505';

function toReading(record: ReadingRecord): Reading {
  return { ...record, slotLabel: SLOT_LABELS[record.slot] };
}

function notFound() {
  return new AppError(404, READING_MESSAGES.notFound, 'READING_NOT_FOUND');
}

function slotTaken(slot: ReadingSlot) {
  const label = SLOT_LABELS[slot];
  const article = /^[aeiou]/i.test(label) ? 'an' : 'a';
  const message = `You already have ${article} ${label} reading for this date.`;
  return new AppError(409, message, 'SLOT_TAKEN', { slot: message });
}

async function assertCanSave(
  userId: string,
  input: ReadingInput,
  excludeId: string | null,
): Promise<void> {
  const count = await readingsRepository.countOnDate(userId, input.date, excludeId);
  if (count >= MAX_READINGS_PER_DAY) {
    throw new AppError(409, READING_MESSAGES.dailyLimit, 'DAILY_LIMIT_REACHED');
  }
  if (await readingsRepository.slotIsTaken(userId, input.date, input.slot, excludeId)) {
    throw slotTaken(input.slot);
  }
}

function rethrowSlotRace(error: unknown, slot: ReadingSlot): never {
  if (error instanceof pg.DatabaseError && error.code === UNIQUE_VIOLATION) throw slotTaken(slot);
  throw error;
}

async function assertOwned(userId: string, id: string): Promise<void> {
  const isUuid = readingIdSchema.safeParse(id).success;
  if (!isUuid || !(await readingsRepository.findById(userId, id))) throw notFound();
}

export async function listReadings(userId: string, date: string): Promise<Reading[]> {
  return (await readingsRepository.listByDate(userId, date)).map(toReading);
}

export async function createReading(userId: string, input: ReadingInput): Promise<Reading> {
  await assertCanSave(userId, input, null);
  try {
    return toReading(await readingsRepository.insert(userId, input));
  } catch (error) {
    return rethrowSlotRace(error, input.slot);
  }
}

export async function updateReading(
  userId: string,
  id: string,
  input: ReadingInput,
): Promise<Reading> {
  await assertOwned(userId, id);
  await assertCanSave(userId, input, id);
  try {
    const record = await readingsRepository.update(userId, id, input);
    if (!record) throw notFound();
    return toReading(record);
  } catch (error) {
    if (error instanceof AppError) throw error;
    return rethrowSlotRace(error, input.slot);
  }
}

export async function deleteReading(userId: string, id: string): Promise<void> {
  await assertOwned(userId, id);
  if (!(await readingsRepository.remove(userId, id))) throw notFound();
}
