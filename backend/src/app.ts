import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestLogger } from './middleware/requestLogger';
import authRouter from './modules/auth/auth.router';
import tenantRouter from './modules/tenants/tenant.router';
import logsRouter from './modules/logs/logs.router';
import usersRouter from './modules/users/users.router';
import analyticsRouter from './modules/analytics/analytics.router';
import { apiKeyAuth } from './middleware/apiKeyAuth';
import ingestRouter from './modules/logs/ingest.router';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logging (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Custom request logging
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'logpulse-api',
    version: '1.0.0',
  });
});

// API Routes
const API_V1 = '/api/v1';

// Public ingestion endpoint (API key auth)
app.use(`${API_V1}/logs/ingest`, ingestRouter);

// JWT-authenticated routes
app.use(`${API_V1}/auth`, authRouter);
app.use(`${API_V1}/tenants`, tenantRouter);
app.use(`${API_V1}/logs`, logsRouter);
app.use(`${API_V1}/users`, usersRouter);
app.use(`${API_V1}/analytics`, analyticsRouter);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
