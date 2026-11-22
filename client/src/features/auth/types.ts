import type { Gender } from '@/features/body/bodyProportions';

export type UserRole = 'patient' | 'doctor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dateOfBirth: string | null;
  gender: Gender;
}
