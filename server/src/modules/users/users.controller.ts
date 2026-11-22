import type { Request, Response } from 'express';
import type { UpdateMeInput } from './users.schemas.js';
import * as usersService from './users.service.js';

export async function updateMe(req: Request, res: Response) {
  const currentUser = req.user as NonNullable<Request['user']>;
  res.json({ user: await usersService.updateProfile(currentUser.id, req.body as UpdateMeInput) });
}
