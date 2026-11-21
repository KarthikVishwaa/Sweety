import jwt, { type SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../../config/env.js';
import type { User } from './auth.types.js';

const ALGORITHM = 'HS256';

const payloadSchema = z.object({
  sub: z.string(),
  role: z.enum(['patient', 'doctor']),
  exp: z.number(),
  iat: z.number(),
});

export function signAuthToken(user: User): { token: string; maxAgeMs: number } {
  const token = jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    algorithm: ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
  const { exp, iat } = payloadSchema.parse(jwt.decode(token));
  return { token, maxAgeMs: (exp - iat) * 1000 };
}

export function verifyAuthToken(token: string): { userId: string } | undefined {
  try {
    const payload = payloadSchema.parse(
      jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] }),
    );
    return { userId: payload.sub };
  } catch {
    return undefined;
  }
}
