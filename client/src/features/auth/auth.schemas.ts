import { z } from 'zod';
import { isRealDate, todayInIST, yearsAgo } from '@/lib/date';

export const MAX_AGE_YEARS = 120;

const DATE_OF_BIRTH_MESSAGES = {
  required: 'Please enter your date of birth.',
  invalid: 'Please enter a valid date of birth.',
  future: 'Date of birth cannot be in the future.',
} as const;

const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address'));

const dateOfBirth = z
  .string()
  .trim()
  .min(1, DATE_OF_BIRTH_MESSAGES.required)
  .superRefine((value, ctx) => {
    const today = todayInIST();
    if (!isRealDate(value) || value < yearsAgo(today, MAX_AGE_YEARS)) {
      ctx.addIssue({ code: 'custom', message: DATE_OF_BIRTH_MESSAGES.invalid });
    } else if (value > today) {
      ctx.addIssue({ code: 'custom', message: DATE_OF_BIRTH_MESSAGES.future });
    }
  });

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters'),
  email,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/\d/, 'Password must contain at least one number'),
  dateOfBirth,
});

export const ACCOUNT_FIELDS = ['name', 'email', 'password'] as const;
export const SIGNUP_FIELDS = [...ACCOUNT_FIELDS, 'dateOfBirth'] as const;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
