import { LogsRepository } from '../../logs/repositories/logs.repository';
import { redisClient, REDIS_KEYS, CACHE_TTL } from '../../../config/redis';
import { logger } from '../../../utils/logger';

export class AnalyticsService {
  private logsRepo = new LogsRepository();

  async getStats(tenantId: string) {
    const cacheKey = REDIS_KEYS.TENANT_STATS(tenantId);

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch { }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [lastHourCounts, lastDayCounts, logsPerMinute] = await Promise.all([
      this.logsRepo.getLogCountByLevel(tenantId, oneHourAgo),
      this.logsRepo.getLogCountByLevel(tenantId, oneDayAgo),
      this.logsRepo.getLogsPerMinute(tenantId, 60),
    ]);

    const totalLastHour = Object.values(lastHourCounts).reduce(
      (a: number, b: number) => a + b, 0
    );
    const errorsLastHour = lastHourCounts['error'] || 0;
    const errorRate = totalLastHour > 0 ? (errorsLastHour / totalLastHour) * 100 : 0;

    const stats = {
      lastHour: {
        total: totalLastHour,
        byLevel: lastHourCounts,
        errorRate: Math.round(errorRate * 100) / 100,
      },
      lastDay: {
        total: Object.values(lastDayCounts).reduce((a: number, b: number) => a + b, 0),
        byLevel: lastDayCounts,
      },
      logsPerMinute,
      generatedAt: now.toISOString(),
    };

    try {
      await redisClient.setex(cacheKey, CACHE_TTL.TENANT_STATS, JSON.stringify(stats));
    } catch { }

    return stats;
  }
}