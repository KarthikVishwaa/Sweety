import { z } from 'zod';
import { monthOf, isMonth } from './insights.month.js';
import { INSIGHTS_MESSAGES } from './insights.constants.js';
import { todayInTimeZone } from '../../utils/date.js';

// A month that is not given means the current one, so the controller fills it in.
export const insightsQuerySchema = z
  .object({
    month: z
      .string({ error: INSIGHTS_MESSAGES.monthInvalid })
      .refine(isMonth, INSIGHTS_MESSAGES.monthInvalid)
      .optional(),
  })
  .refine(({ month }) => month === undefined || month <= monthOf(todayInTimeZone()), {
    path: ['month'],
    error: INSIGHTS_MESSAGES.monthInFuture,
  });
