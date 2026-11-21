import type { Request, Response } from 'express';
import type { UpdateMeInput } from './users.schemas.js';
import * as usersService from './users.service.js';

export async function updateMe(req: Request, res: Response) {
  const { bodyModel } = req.body as UpdateMeInput;
  const currentUser = req.user as NonNullable<Request['user']>;
  res.json({ user: await usersService.changeBodyModel(currentUser.id, bodyModel) });
}
