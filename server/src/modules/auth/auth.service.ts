import bcrypt from 'bcrypt';
import pg from 'pg';
import { AppError } from '../../lib/AppError.js';
import { findUserByEmail, findUserById, insertUser } from './auth.repository.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';
import { signAuthToken } from './auth.tokens.js';
import type { AuthSession, User, UserRecord } from './auth.types.js';

export const BCRYPT_COST = 12;
const UNIQUE_VIOLATION = '23505';
// Checked when the email is unknown, so a wrong email and a wrong password take about the same time.
const DUMMY_PASSWORD_HASH = '$2b$12$1TVgqnUqoOjKinpl/VD8.u4Xcz.EkQPqlpAqmG5N8xp6LctaXVz.i';

export function toUser({
  id,
  name,
  email,
  role,
  dateOfBirth,
  gender,
  createdAt,
}: UserRecord): User {
  return { id, name, email, role, dateOfBirth, gender, createdAt: createdAt.toISOString() };
}

function startSession(record: UserRecord): AuthSession {
  const user = toUser(record);
  return { user, ...signAuthToken(user) };
}

export async function register({
  name,
  email,
  password,
  dateOfBirth,
  gender,
}: RegisterInput): Promise<AuthSession> {
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  try {
    return startSession(await insertUser({ name, email, passwordHash, dateOfBirth, gender }));
  } catch (error) {
    if (error instanceof pg.DatabaseError && error.code === UNIQUE_VIOLATION) {
      const message = 'An account with this email already exists.';
      throw new AppError(409, message, 'EMAIL_TAKEN', { email: message });
    }
    throw error;
  }
}

export async function login({ email, password }: LoginInput): Promise<AuthSession> {
  const record = await findUserByEmail(email);
  const passwordMatches = await bcrypt.compare(
    password,
    record?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!record || !passwordMatches) {
    throw new AppError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
  }
  return startSession(record);
}

export async function getUser(id: string): Promise<User | undefined> {
  const record = await findUserById(id);
  return record && toUser(record);
}
