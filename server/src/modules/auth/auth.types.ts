export const GENDERS = ['male', 'female', 'other'] as const;

export type Gender = (typeof GENDERS)[number];

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

export interface UserRecord extends Omit<User, 'createdAt'> {
  passwordHash: string;
  createdAt: Date;
}

export interface NewUser {
  name: string;
  email: string;
  passwordHash: string;
  dateOfBirth: string;
  gender: Gender;
}

export interface AuthSession {
  user: User;
  token: string;
  maxAgeMs: number;
}
