import { Server as SocketServer } from 'socket.io';
import { redisClient, REDIS_KEYS } from '../config/redis';
import { LogsRepository, CreateLogInput } from '../modules/logs/repositories/logs.repository';
import { LogsService } from '../modules/logs/services/logs.service';
import { broadcastToTenant } from '../config/socket';
import { logger } from '../utils/logger';
import { LogLevel } from '@prisma/client';

const BATCH_SIZE = 50;
const POLL_INTERVAL_MS = 500;
const MAX_BATCH_WAIT_MS = 2000;

export class LogWorker {
  private io: SocketServer;
  private logsRepo = new LogsRepository();
  private logsService = new LogsService();
  private isRunning = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private processingCount = 0;

  constructor(io: SocketServer) {
    this.io = io;
  }

  async start(): Promise<void> {
    this.isRunning = true;
    logger.info('🔄 Log worker started - polling Redis queue');
    this.scheduleNextPoll();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    // Wait for in-flight processing
    let waited = 0;
    while (this.processingCount > 0 && waited < 5000) {
      await this.sleep(100);
      waited += 100;
    }
    logger.info('🛑 Log worker stopped');
  }

  private scheduleNextPoll(): void {
    if (!this.isRunning) return;
    this.pollTimer = setTimeout(() => this.poll(), POLL_INTERVAL_MS);
  }

  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    try {
      this.processingCount++;
      await this.processBatch();
    } catch (err) {
      logger.error('Log worker poll error:', err);
    } finally {
      this.processingCount--;
      this.scheduleNextPoll();
    }
  }

  private async processBatch(): Promise<void> {
    // LMPOP / LPOP multiple items from the queue
    const items: string[] = [];
    
    // Pop up to BATCH_SIZE items at once
    const pipeline = redisClient.pipeline();
    for (let i = 0; i < BATCH_SIZE; i++) {
      pipeline.lpop(REDIS_KEYS.LOG_QUEUE);
    }
    
    const results = await pipeline.exec();
    if (!results) return;

    for (const [err, value] of results) {
      if (!err && value) {
        items.push(value as string);
      }
    }

    if (items.length === 0) return;

    logger.debug(`Processing batch of ${items.length} logs`);

    // Parse and group by tenant for efficient batch insert
    const logsByTenant = new Map<string, CreateLogInput[]>();

    for (const item of items) {
      try {
        const payload = JSON.parse(item);
        
        // Validate level
        const validLevels: LogLevel[] = ['info', 'warn', 'error', 'debug'];
        if (!validLevels.includes(payload.level)) {
          payload.level = 'info';
        }

        const log: CreateLogInput = {
          tenantId: payload.tenantId,
          message: payload.message,
          level: payload.level as LogLevel,
          timestamp: new Date(payload.timestamp || Date.now()),
          metadata: payload.metadata,
          source: payload.source,
        };

        if (!logsByTenant.has(payload.tenantId)) {
          logsByTenant.set(payload.tenantId, []);
        }
        logsByTenant.get(payload.tenantId)!.push(log);
      } catch (parseErr) {
        logger.warn('Failed to parse queued log:', parseErr);
      }
    }

    // Process each tenant's batch
    for (const [tenantId, logs] of logsByTenant.entries()) {
      try {
        await this.logsRepo.createMany(logs);
        
        // Invalidate recent logs cache for this tenant
        await this.logsService.invalidateRecentLogsCache(tenantId);

        // Broadcast to connected WebSocket clients of this tenant
        for (const log of logs) {
          broadcastToTenant(this.io, tenantId, 'log:new', {
            ...log,
            id: `temp-${Date.now()}`,
            createdAt: new Date().toISOString(),
          });
        }

        logger.debug(`✅ Stored ${logs.length} logs for tenant ${tenantId}`);
      } catch (dbErr) {
        logger.error(`Failed to store logs for tenant ${tenantId}:`, dbErr);
        
        // Re-queue failed logs (simple retry - production would use dead letter queue)
        for (const log of logs) {
          await redisClient.rpush(REDIS_KEYS.LOG_QUEUE, JSON.stringify({
            ...log,
            _retryCount: (log as any)._retryCount ? (log as any)._retryCount + 1 : 1,
          })).catch(() => {});
        }
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
