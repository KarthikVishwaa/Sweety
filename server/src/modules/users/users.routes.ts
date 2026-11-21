import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../auth/auth.middleware.js';
import * as usersController from './users.controller.js';
import { updateMeSchema } from './users.schemas.js';

export const usersRouter = Router();

usersRouter.patch('/me', requireAuth, validate(updateMeSchema), usersController.updateMe);
