import { z } from 'zod';
import { gender } from '../auth/auth.schemas.js';

export const updateMeSchema = z.object({ gender });

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
