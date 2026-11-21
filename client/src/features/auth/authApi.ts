import { api, ApiError } from '@/lib/api';
import type { LoginInput, SignupInput } from './auth.schemas';
import type { User } from './types';

interface UserResponse {
  user: User;
}

const UNAUTHORIZED = 401;

export async function getMe(): Promise<User | null> {
  try {
    const { data } = await api.get<UserResponse>('/auth/me');
    return data.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === UNAUTHORIZED) return null;
    throw error;
  }
}

export async function login(input: LoginInput): Promise<User> {
  const { data } = await api.post<UserResponse>('/auth/login', input);
  return data.user;
}

export async function register(input: SignupInput): Promise<User> {
  const { data } = await api.post<UserResponse>('/auth/register', input);
  return data.user;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}
