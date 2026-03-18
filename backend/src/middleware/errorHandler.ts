import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      error = AppError.conflict('A record with this value already exists');
    } else if (err.code === 'P2025') {
      error = AppError.notFound('Record');
    } else {
      error = new AppError('Database error', 500, 'DB_ERROR', false);
    }
  }

  // Handle Zod errors
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => e.message).join(', ');
    error = AppError.badRequest(messages);
  }

  if (error instanceof AppError) {
    if (!error.isOperational) {
      logger.error('Non-operational error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
      });
    }

    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Unhandled errors
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
    timestamp: new Date().toISOString(),
  });
};
