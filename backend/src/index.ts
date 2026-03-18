import dotenv from 'dotenv';
dotenv.config();
import http from 'http';
import app from './app';
import { createSocketServer } from './config/socket';
import { redisClient, redisSubscriber } from './config/redis';
import { prisma } from './config/database';
import { logger } from './utils/logger';
import { LogWorker } from './workers/logWorker';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Test Redis connection
    await redisClient.ping();
    logger.info('✅ Redis connected');

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Initialize Socket.IO
    const io = createSocketServer(httpServer);
    app.set('io', io);

    // Start log worker
    const logWorker = new LogWorker(io);
    await logWorker.start();
    logger.info('✅ Log worker started');

    // Start server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 LogPulse API running on port ${PORT}`);
      logger.info(`📡 WebSocket server ready`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`\n⚠️  ${signal} received. Shutting down gracefully...`);

      await logWorker.stop();
      httpServer.close(async () => {
        await prisma.$disconnect();
        await redisClient.quit();
        await redisSubscriber.quit();
        logger.info('✅ Server shut down cleanly');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
