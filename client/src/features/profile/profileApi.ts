import type { User } from '@/features/auth/types';
import type { Gender } from '@/features/body/bodyProportions';
import { api } from '@/lib/api';

export interface ProfileChanges {
  name?: string;
  gender?: Gender;
  dateOfBirth?: string;
}

export async function updateProfile(changes: ProfileChanges): Promise<User> {
  const { data } = await api.patch<{ user: User }>('/users/me', changes);
  return data.user;
}
