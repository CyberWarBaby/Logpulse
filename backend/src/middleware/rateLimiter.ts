import { Request, Response, NextFunction } from 'express';
import { redisClient, REDIS_KEYS } from '../config/redis';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  message?: string;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    keyGenerator = (req) => req.ip || 'unknown',
    message = 'Too many requests, please slow down',
  } = options;

  const windowSeconds = Math.floor(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = REDIS_KEYS.RATE_LIMIT(keyGenerator(req));

    try {
      const current = await redisClient.incr(key);

      if (current === 1) {
        await redisClient.expire(key, windowSeconds);
      }

      const ttl = await redisClient.ttl(key);

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + ttl * 1000).toISOString());

      if (current > max) {
        res.setHeader('Retry-After', ttl);
        return next(AppError.tooManyRequests(message));
      }

      next();
    } catch (err) {
      // Fail open on Redis errors - don't block requests
      logger.warn('Rate limit Redis error, failing open:', err);
      next();
    }
  };
};

// Pre-configured limiters
export const globalRateLimiter = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
});

export const ingestRateLimiter = createRateLimiter({
  windowMs: 60000,
  max: parseInt(process.env.INGEST_RATE_LIMIT_MAX || '1000'),
  keyGenerator: (req: any) => req.tenant?.id || req.ip || 'unknown',
  message: 'Log ingestion rate limit exceeded. Max 1000 logs/minute per tenant.',
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `auth:${req.ip}`,
  message: 'Too many authentication attempts. Try again in 15 minutes.',
});
