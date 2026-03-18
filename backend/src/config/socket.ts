import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface AuthenticatedSocket extends Socket {
  tenantId?: string;
  userId?: string;
}

export const createSocketServer = (httpServer: HttpServer): SocketServer => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // JWT authentication middleware for Socket.IO
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || 
                  socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.tenantId = decoded.tenantId;
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const tenantId = socket.tenantId!;
    const tenantRoom = `tenant:${tenantId}`;

    // Join tenant-specific room for isolation
    socket.join(tenantRoom);
    logger.info(`Socket ${socket.id} joined room ${tenantRoom}`);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket ${socket.id} disconnected: ${reason}`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error for ${socket.id}:`, err);
    });
  });

  return io;
};

// Helper to broadcast to tenant's room only
export const broadcastToTenant = (
  io: SocketServer,
  tenantId: string,
  event: string,
  data: unknown
): void => {
  io.to(`tenant:${tenantId}`).emit(event, data);
};
