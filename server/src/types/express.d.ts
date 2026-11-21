import type { User } from '../modules/auth/auth.types.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}
