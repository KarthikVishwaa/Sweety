export const GENDERS = ['male', 'female', 'other'] as const;

export type Gender = (typeof GENDERS)[number];

export type UserRole = 'patient' | 'doctor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dateOfBirth: string | null;
  gender: Gender;
}

export interface UserRecord extends User {
  passwordHash: string;
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
