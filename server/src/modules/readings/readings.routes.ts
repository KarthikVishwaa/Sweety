import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../auth/auth.middleware.js';
import * as readingsController from './readings.controller.js';
import { readingSchema } from './readings.schemas.js';

export const readingsRouter = Router();

const validateReading = validate(readingSchema, { firstIssueOnly: true });

readingsRouter.use(requireAuth);
readingsRouter.get('/', readingsController.list);
readingsRouter.post('/', validateReading, readingsController.create);
readingsRouter.put('/:id', validateReading, readingsController.update);
readingsRouter.delete('/:id', readingsController.remove);
