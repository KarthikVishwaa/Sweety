import { z } from 'zod';
import { isRealDate, todayInIST } from '@/lib/date';
import { MAX_GLUCOSE_VALUE, MIN_GLUCOSE_VALUE, SLOT_KEYS } from './readings.constants';

const MESSAGES = {
  valueRequired: 'Please enter a glucose value.',
  valueOutOfRange: `Value must be between ${MIN_GLUCOSE_VALUE} and ${MAX_GLUCOSE_VALUE} mg/dl.`,
  dateInvalid: 'Please choose a valid date.',
  slotInvalid: 'Please choose a time slot.',
  dateInFuture: 'Date cannot be in the future.',
};

function isGlucoseValue(raw: string): boolean {
  if (!/^\d+$/.test(raw)) return false;
  const value = Number(raw);
  return value >= MIN_GLUCOSE_VALUE && value <= MAX_GLUCOSE_VALUE;
}

export const readingFormSchema = z.object({
  value: z
    .string()
    .trim()
    .min(1, MESSAGES.valueRequired)
    .refine(isGlucoseValue, MESSAGES.valueOutOfRange)
    .transform(Number),
  date: z.string().superRefine((date, ctx) => {
    if (!isRealDate(date)) ctx.addIssue({ code: 'custom', message: MESSAGES.dateInvalid });
    else if (date > todayInIST()) ctx.addIssue({ code: 'custom', message: MESSAGES.dateInFuture });
  }),
  slot: z.string().pipe(z.enum(SLOT_KEYS, { error: MESSAGES.slotInvalid })),
});

export type ReadingFormInput = z.input<typeof readingFormSchema>;
export type ReadingFormValues = z.output<typeof readingFormSchema>;
