import { LogsRepository, LogFilter } from '../repositories/logs.repository';
import { redisClient, REDIS_KEYS, CACHE_TTL } from '../../../config/redis';
import { getPaginationParams } from '../../../utils/crypto';
import { logger } from '../../../utils/logger';
import { LogLevel } from '@prisma/client';

export class LogsService {
  private logsRepo = new LogsRepository();

  async getLogs(tenantId: string, query: {
    page?: string;
    limit?: string;
    level?: string;
    search?: string;
    from?: string;
    to?: string;
  }) {
    const { page, limit, skip, take } = getPaginationParams(query.page, query.limit);

    const filter: LogFilter = {
      tenantId,
      skip,
      take,
      ...(query.level && { level: query.level as LogLevel }),
      ...(query.search && { search: query.search }),
      ...(query.from && { from: new Date(query.from) }),
      ...(query.to && { to: new Date(query.to) }),
    };

    const { logs, total } = await this.logsRepo.findMany(filter);

    return { logs, total, page, limit };
  }

  async getRecentLogs(tenantId: string, limit = 100) {
    const cacheKey = REDIS_KEYS.LOG_CACHE(tenantId);

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.warn('Cache read error for recent logs:', err);
    }

    const logs = await this.logsRepo.getRecentLogs(tenantId, limit);

    try {
      await redisClient.setex(cacheKey, CACHE_TTL.RECENT_LOGS, JSON.stringify(logs));
    } catch (err) {
      logger.warn('Cache write error for recent logs:', err);
    }

    return logs;
  }

  async invalidateRecentLogsCache(tenantId: string) {
    try {
      await redisClient.del(REDIS_KEYS.LOG_CACHE(tenantId));
    } catch (err) {
      logger.warn('Cache invalidation error:', err);
    }
  }
}
