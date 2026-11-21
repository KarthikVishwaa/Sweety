import { z } from 'zod';
import { isRealCalendarDate, todayInTimeZone } from '../../utils/date.js';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MAX_GLUCOSE_VALUE,
  MIN_GLUCOSE_VALUE,
  READING_MESSAGES,
  SLOT_KEYS,
} from './readings.constants.js';

const WHOLE_NUMBER = /^\d+$/;

const dateField = z
  .string({ error: READING_MESSAGES.dateInvalid })
  .refine(isRealCalendarDate, READING_MESSAGES.dateInvalid);

const valueField = z.unknown().transform((raw, ctx) => {
  const isEmpty =
    raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '');
  if (isEmpty) {
    ctx.addIssue({ code: 'custom', message: READING_MESSAGES.valueRequired });
    return z.NEVER;
  }

  const numeric =
    typeof raw === 'string' ? (WHOLE_NUMBER.test(raw.trim()) ? Number(raw) : Number.NaN) : raw;
  const isValid =
    typeof numeric === 'number' &&
    Number.isInteger(numeric) &&
    numeric >= MIN_GLUCOSE_VALUE &&
    numeric <= MAX_GLUCOSE_VALUE;
  if (!isValid) {
    ctx.addIssue({ code: 'custom', message: READING_MESSAGES.valueOutOfRange });
    return z.NEVER;
  }
  return numeric;
});

export const readingSchema = z
  .object({
    value: valueField,
    date: dateField,
    slot: z.enum(SLOT_KEYS, { error: READING_MESSAGES.slotInvalid }),
  })
  .refine(({ date }) => date <= todayInTimeZone(), {
    path: ['date'],
    error: READING_MESSAGES.dateInFuture,
  });

function queryInteger(message: string, min: number, max: number, fallback: number) {
  return z
    .string({ error: message })
    .regex(WHOLE_NUMBER, message)
    .transform(Number)
    .pipe(z.number().min(min, message).max(max, message))
    .default(fallback);
}

export const listQuerySchema = z.object({
  date: dateField.optional(),
  page: queryInteger(READING_MESSAGES.pageInvalid, 1, Number.MAX_SAFE_INTEGER, DEFAULT_PAGE),
  limit: queryInteger(READING_MESSAGES.limitInvalid, 1, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

export const readingIdSchema = z.uuid();
