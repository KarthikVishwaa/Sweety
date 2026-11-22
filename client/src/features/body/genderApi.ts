import { api } from '@/lib/api';
import type { User } from '@/features/auth/types';
import type { Gender } from './bodyProportions';

export async function updateGender(gender: Gender): Promise<User> {
  const { data } = await api.patch<{ user: User }>('/users/me', { gender });
  return data.user;
}
