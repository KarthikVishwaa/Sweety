import type { Request, Response } from 'express';
import type { UpdateMeInput } from './users.schemas.js';
import * as usersService from './users.service.js';

export async function updateMe(req: Request, res: Response) {
  const { gender } = req.body as UpdateMeInput;
  const currentUser = req.user as NonNullable<Request['user']>;
  res.json({ user: await usersService.changeGender(currentUser.id, gender) });
}
