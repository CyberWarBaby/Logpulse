import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { hashApiKey } from '../utils/crypto';
import { redisClient, REDIS_KEYS, CACHE_TTL } from '../config/redis';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface ApiKeyRequest extends Request {
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  apiKeyId?: string;
}

export const apiKeyAuth = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return next(AppError.unauthorized('API key required. Include X-API-Key header.'));
  }

  try {
    const keyHash = hashApiKey(apiKey);
    const cacheKey = REDIS_KEYS.API_KEY_CACHE(keyHash);

    // Check cache first
    let tenantData: { tenantId: string; tenantName: string; tenantSlug: string; keyId: string } | null = null;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        tenantData = JSON.parse(cached);
      }
    } catch (cacheErr) {
      logger.warn('Redis cache miss for API key:', cacheErr);
    }

    if (!tenantData) {
      // Cache miss - check database
      const apiKeyRecord = await prisma.apiKey.findFirst({
        where: {
          keyHash,
          isActive: true,
          revokedAt: null,
        },
        include: {
          tenant: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      if (!apiKeyRecord) {
        return next(AppError.unauthorized('Invalid or revoked API key'));
      }

      tenantData = {
        tenantId: apiKeyRecord.tenant.id,
        tenantName: apiKeyRecord.tenant.name,
        tenantSlug: apiKeyRecord.tenant.slug,
        keyId: apiKeyRecord.id,
      };

      // Cache the result
      await redisClient.setex(cacheKey, CACHE_TTL.API_KEY, JSON.stringify(tenantData));

      // Update last used (fire and forget)
      prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: { lastUsedAt: new Date() },
      }).catch((err) => logger.warn('Failed to update API key lastUsedAt:', err));
    }

    req.tenant = {
      id: tenantData.tenantId,
      name: tenantData.tenantName,
      slug: tenantData.tenantSlug,
    };
    req.apiKeyId = tenantData.keyId;

    next();
  } catch (err) {
    logger.error('API key auth error:', err);
    next(err);
  }
};
