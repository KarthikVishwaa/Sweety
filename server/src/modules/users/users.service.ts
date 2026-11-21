import { AppError } from '../../lib/AppError.js';
import { toUser } from '../auth/auth.service.js';
import type { BodyModel, User } from '../auth/auth.types.js';
import * as usersRepository from './users.repository.js';

export async function changeBodyModel(userId: string, bodyModel: BodyModel): Promise<User> {
  const record = await usersRepository.updateBodyModel(userId, bodyModel);
  if (!record) throw new AppError(404, 'User not found.', 'USER_NOT_FOUND');
  return toUser(record);
}
