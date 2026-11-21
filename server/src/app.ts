import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { authLimiter, globalLimiter } from './middleware/rateLimiters.js';
import { healthRouter } from './modules/health/health.routes.js';

export const app = express();

app.disable('x-powered-by');

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(globalLimiter);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(hpp());

app.use('/api/auth', authLimiter);
app.use('/api/health', healthRouter);

app.use(notFound);
app.use(errorHandler);
