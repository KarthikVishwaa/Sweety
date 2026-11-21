import bcrypt from 'bcrypt';
import pg from 'pg';
import { AppError } from '../../lib/AppError.js';
import { findUserByEmail, findUserById, insertUser } from './auth.repository.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';
import { signAuthToken } from './auth.tokens.js';
import type { AuthSession, User, UserRecord } from './auth.types.js';

const BCRYPT_COST = 12;
const UNIQUE_VIOLATION = '23505';
const DUMMY_PASSWORD_HASH = '$2b$12$1TVgqnUqoOjKinpl/VD8.u4Xcz.EkQPqlpAqmG5N8xp6LctaXVz.i';

function toUser({ id, name, email, role }: UserRecord): User {
  return { id, name, email, role };
}

function startSession(record: UserRecord): AuthSession {
  const user = toUser(record);
  return { user, ...signAuthToken(user) };
}

export async function register({ name, email, password }: RegisterInput): Promise<AuthSession> {
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  try {
    return startSession(await insertUser({ name, email, passwordHash }));
  } catch (error) {
    if (error instanceof pg.DatabaseError && error.code === UNIQUE_VIOLATION) {
      throw new AppError(409, 'An account with this email already exists.', 'EMAIL_TAKEN');
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
