import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import * as reportsController from './reports.controller.js';

export const reportsRouter = Router();

reportsRouter.get('/', requireAuth, reportsController.getReport);
