export type UserRole = 'patient' | 'doctor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dateOfBirth: string | null;
}

export interface UserRecord extends User {
  passwordHash: string;
}

export interface NewUser {
  name: string;
  email: string;
  passwordHash: string;
  dateOfBirth: string;
}

export interface AuthSession {
  user: User;
  token: string;
  maxAgeMs: number;
}
