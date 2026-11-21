import { z } from 'zod';
import { bodyModel } from '../auth/auth.schemas.js';

export const updateMeSchema = z.object({ bodyModel });

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
