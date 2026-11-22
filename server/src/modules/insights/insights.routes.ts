import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import * as insightsController from './insights.controller.js';

export const insightsRouter = Router();

insightsRouter.get('/', requireAuth, insightsController.getInsights);
