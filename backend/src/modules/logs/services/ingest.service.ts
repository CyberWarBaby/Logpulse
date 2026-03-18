import { redisClient, REDIS_KEYS } from '../../../config/redis';
import { LogsRepository } from '../repositories/logs.repository';
import { logger } from '../../../utils/logger';
import { LogLevel } from '@prisma/client';

export interface IngestPayload {
  tenantId: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  timestamp?: string;
  metadata?: Record<string, unknown>;
  source?: string;
}

export class IngestService {
  private logsRepo = new LogsRepository();

  async ingest(payload: IngestPayload): Promise<{ queued: boolean; queueSize: number; fallback?: boolean }> {
    const queueItem = {
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString(),
      queuedAt: new Date().toISOString(),
    };

    try {
      const queueSize = await redisClient.rpush(
        REDIS_KEYS.LOG_QUEUE,
        JSON.stringify(queueItem)
      );
      logger.debug(`Log queued for tenant ${payload.tenantId}, queue size: ${queueSize}`);
      return { queued: true, queueSize };

    } catch (err) {
      // Redis down — write directly to DB
      logger.warn('Redis unavailable, writing log directly to DB');
      try {
        await this.logsRepo.create({
          tenantId: payload.tenantId,
          message: payload.message,
          level: payload.level as LogLevel,
          timestamp: new Date(payload.timestamp || Date.now()),
          metadata: payload.metadata,
          source: payload.source,
        });
        return { queued: false, queueSize: 0, fallback: true };
      } catch (dbErr) {
        // both down — accept and drop, never crash
        logger.error('Both Redis and DB unavailable, log dropped');
        return { queued: false, queueSize: 0, fallback: false };
      }
    }
  }

  async getQueueDepth(): Promise<number> {
    try {
      return await redisClient.llen(REDIS_KEYS.LOG_QUEUE);
    } catch {
      return -1;
    }
  }
}