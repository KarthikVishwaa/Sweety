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
import { globalLimiter } from './middleware/rateLimiters.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { insightsRouter } from './modules/insights/insights.routes.js';
import { readingsRouter } from './modules/readings/readings.routes.js';
import { reportsRouter } from './modules/reports/reports.routes.js';
import { usersRouter } from './modules/users/users.routes.js';

export const app = express();

app.disable('x-powered-by');
// Behind the bundled nginx the real client address is in X-Forwarded-For, and the rate limiter needs it.
app.set('trust proxy', env.TRUST_PROXY);

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(globalLimiter);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(hpp());

app.use('/api/auth', authRouter);
app.use('/api/health', healthRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/readings', readingsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/users', usersRouter);

app.use(notFound);
app.use(errorHandler);
