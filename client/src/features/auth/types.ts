import type { Gender } from '@/features/body/bodyProportions';

export type UserRole = 'patient' | 'doctor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dateOfBirth: string | null;
  /** Null until the person chooses one (accounts made before gender existed). */
  gender: Gender | null;
  /** When the account was made, as an ISO timestamp. */
  createdAt: string;
}
