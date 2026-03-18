import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(AppError.notFound(`Route ${req.method} ${req.path}`));
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 500) {
      logger.warn(`Slow request: ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
};
