import { z } from 'zod';
import { isRealCalendarDate, todayInTimeZone } from '../../utils/date.js';
import { REPORT_TYPES } from './reports.types.js';

export const REPORT_MESSAGES = {
  typeInvalid: 'Please choose a valid report type.',
  dateInvalid: 'Please choose a valid date.',
  dateInFuture: 'Date cannot be in the future.',
} as const;

export const reportQuerySchema = z
  .object({
    type: z.enum(REPORT_TYPES, { error: REPORT_MESSAGES.typeInvalid }),
    date: z
      .string({ error: REPORT_MESSAGES.dateInvalid })
      .refine(isRealCalendarDate, REPORT_MESSAGES.dateInvalid),
  })
  .refine(({ date }) => date <= todayInTimeZone(), {
    path: ['date'],
    error: REPORT_MESSAGES.dateInFuture,
  });
