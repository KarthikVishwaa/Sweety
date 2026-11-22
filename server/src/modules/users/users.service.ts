import { AppError } from '../../lib/AppError.js';
import { toUser } from '../auth/auth.service.js';
import type { User } from '../auth/auth.types.js';
import * as usersRepository from './users.repository.js';
import type { UpdateMeInput } from './users.schemas.js';

export async function updateProfile(userId: string, changes: UpdateMeInput): Promise<User> {
  const record = await usersRepository.updateProfile(userId, changes);
  if (!record) throw new AppError(404, 'User not found.', 'USER_NOT_FOUND');
  return toUser(record);
}
