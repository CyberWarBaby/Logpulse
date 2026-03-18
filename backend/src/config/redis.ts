import Redis from 'ioredis';
import { logger } from '../utils/logger';

const createRedisClient = (name: string): Redis => {
  const client = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    enableReadyCheck: true,
    lazyConnect: false,
  });

  client.on('connect', () => logger.info(`Redis [${name}] connecting...`));
  client.on('ready', () => logger.info(`Redis [${name}] ready`));
  client.on('error', (err) => logger.error(`Redis [${name}] error:`, err));
  client.on('close', () => logger.warn(`Redis [${name}] connection closed`));
  client.on('reconnecting', () => logger.info(`Redis [${name}] reconnecting...`));

  return client;
};

// Main client for operations
export const redisClient = createRedisClient('main');

// Separate subscriber client (can't do other commands while subscribed)
export const redisSubscriber = createRedisClient('subscriber');

// Redis key prefixes
export const REDIS_KEYS = {
  LOG_QUEUE: 'logpulse:queue:logs',
  LOG_CACHE: (tenantId: string) => `logpulse:cache:logs:${tenantId}`,
  RATE_LIMIT: (key: string) => `logpulse:ratelimit:${key}`,
  API_KEY_CACHE: (keyHash: string) => `logpulse:cache:apikey:${keyHash}`,
  TENANT_STATS: (tenantId: string) => `logpulse:stats:${tenantId}`,
  SOCKET_ROOMS: (tenantId: string) => `logpulse:room:${tenantId}`,
} as const;

export const CACHE_TTL = {
  API_KEY: 300,        // 5 minutes
  RECENT_LOGS: 60,     // 1 minute
  TENANT_STATS: 30,    // 30 seconds
} as const;
