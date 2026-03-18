import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

if (process.env.NODE_ENV === 'development') {
  // Log slow queries only
  prisma.$on('query' as never, (e: any) => {
    if (e.duration > 100) {
      logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
    }
  });
}

prisma.$on('error' as never, (e: any) => {
  logger.error('Prisma error:', e);
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
