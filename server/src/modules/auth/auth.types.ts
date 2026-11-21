export const BODY_MODELS = ['male', 'female'] as const;

export type BodyModel = (typeof BODY_MODELS)[number];

export type UserRole = 'patient' | 'doctor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dateOfBirth: string | null;
  bodyModel: BodyModel;
}

export interface UserRecord extends User {
  passwordHash: string;
}

export interface NewUser {
  name: string;
  email: string;
  passwordHash: string;
  dateOfBirth: string;
  bodyModel: BodyModel;
}

export interface AuthSession {
  user: User;
  token: string;
  maxAgeMs: number;
}
