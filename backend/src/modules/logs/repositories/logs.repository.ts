import { prisma } from '../../../config/database';
import { Log, LogLevel, Prisma } from '@prisma/client';

export interface LogFilter {
  tenantId: string;
  level?: LogLevel;
  search?: string;
  from?: Date;
  to?: Date;
  skip?: number;
  take?: number;
}

export interface CreateLogInput {
  tenantId: string;
  message: string;
  level: LogLevel;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
  source?: string;
}

export class LogsRepository {
  async create(data: CreateLogInput): Promise<Log> {
    return prisma.log.create({
      data: {
        tenantId: data.tenantId,
        message: data.message,
        level: data.level,
        timestamp: data.timestamp || new Date(),
        metadata: data.metadata as Prisma.InputJsonValue,
        source: data.source,
      },
    });
  }

  async createMany(logs: CreateLogInput[]): Promise<number> {
    const result = await prisma.log.createMany({
      data: logs.map((l) => ({
        tenantId: l.tenantId,
        message: l.message,
        level: l.level,
        timestamp: l.timestamp || new Date(),
        metadata: l.metadata as Prisma.InputJsonValue,
        source: l.source,
      })),
    });
    return result.count;
  }

  async findMany(filter: LogFilter): Promise<{ logs: Log[]; total: number }> {
    const where: Prisma.LogWhereInput = {
      tenantId: filter.tenantId,
      ...(filter.level && { level: filter.level }),
      ...(filter.search && {
        message: { contains: filter.search, mode: 'insensitive' },
      }),
      ...(filter.from || filter.to
        ? {
            timestamp: {
              ...(filter.from && { gte: filter.from }),
              ...(filter.to && { lte: filter.to }),
            },
          }
        : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: filter.skip || 0,
        take: filter.take || 50,
      }),
      prisma.log.count({ where }),
    ]);

    return { logs, total };
  }

  async getRecentLogs(tenantId: string, limit = 100): Promise<Log[]> {
    return prisma.log.findMany({
      where: { tenantId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async getLogCountByLevel(tenantId: string, since: Date): Promise<Record<string, number>> {
    const counts = await prisma.log.groupBy({
      by: ['level'],
      where: { tenantId, timestamp: { gte: since } },
      _count: { id: true },
    });

    return counts.reduce(
      (acc, item) => ({ ...acc, [item.level]: item._count.id }),
      {} as Record<string, number>
    );
  }

  async getLogsPerMinute(tenantId: string, minutes = 60): Promise<{ time: string; count: number }[]> {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    // Raw query for time-bucketed counts
    const result = await prisma.$queryRaw<{ bucket: Date; count: bigint }[]>`
      SELECT
        date_trunc('minute', timestamp) as bucket,
        COUNT(*) as count
      FROM logs
      WHERE "tenantId" = ${tenantId}
        AND timestamp >= ${since}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    return result.map((r) => ({
      time: r.bucket.toISOString(),
      count: Number(r.count),
    }));
  }

  async deleteOldLogs(tenantId: string, olderThan: Date): Promise<number> {
    const result = await prisma.log.deleteMany({
      where: { tenantId, createdAt: { lt: olderThan } },
    });
    return result.count;
  }
}
