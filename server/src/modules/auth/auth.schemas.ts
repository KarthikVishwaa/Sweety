import { z } from 'zod';
import { BODY_MODELS } from './auth.types.js';
import { isRealCalendarDate, todayInTimeZone, yearsAgo } from '../../utils/date.js';

const MAX_AGE_YEARS = 120;

const DATE_OF_BIRTH_MESSAGES = {
  required: 'Please enter your date of birth.',
  invalid: 'Please enter a valid date of birth.',
  future: 'Date of birth cannot be in the future.',
} as const;

export const bodyModel = z.enum(BODY_MODELS, { error: 'Please choose a body model.' });

const dateOfBirth = z
  .string({ error: DATE_OF_BIRTH_MESSAGES.required })
  .trim()
  .min(1, DATE_OF_BIRTH_MESSAGES.required)
  .superRefine((value, ctx) => {
    const today = todayInTimeZone();
    if (!isRealCalendarDate(value) || value < yearsAgo(today, MAX_AGE_YEARS)) {
      ctx.addIssue({ code: 'custom', message: DATE_OF_BIRTH_MESSAGES.invalid });
    } else if (value > today) {
      ctx.addIssue({ code: 'custom', message: DATE_OF_BIRTH_MESSAGES.future });
    }
  });

const email = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address'));

export const registerSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters'),
  email,
  password: z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/\d/, 'Password must contain at least one number'),
  dateOfBirth,
  bodyModel,
});

export const loginSchema = z.object({
  email,
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
