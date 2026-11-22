import { z } from 'zod';
import { dateOfBirth, gender, name } from '@/features/auth/auth.schemas';

// The same rules, and the same messages, as signing up.
export const editProfileSchema = z.object({ name, dateOfBirth, gender });

export type EditProfileInput = z.infer<typeof editProfileSchema>;
