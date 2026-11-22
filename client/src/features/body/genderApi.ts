import { api } from '@/lib/api';
import type { User } from '@/features/auth/types';
import type { BodyModel } from './bodyProportions';

export async function updateBodyModel(bodyModel: BodyModel): Promise<User> {
  const { data } = await api.patch<{ user: User }>('/users/me', { bodyModel });
  return data.user;
}
