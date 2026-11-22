import { z } from 'zod';
import { dateOfBirth, gender, name } from '../auth/auth.schemas.js';

export const UPDATE_ME_MESSAGES = { nothingToChange: 'Please change at least one field.' } as const;

// Any of these may be sent, but at least one must be. Email and password are not changed here.
export const updateMeSchema = z
  .object({ name: name.optional(), gender: gender.optional(), dateOfBirth: dateOfBirth.optional() })
  .refine(
    (input) =>
      input.name !== undefined || input.gender !== undefined || input.dateOfBirth !== undefined,
    { path: ['changes'], error: UPDATE_ME_MESSAGES.nothingToChange },
  );

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
