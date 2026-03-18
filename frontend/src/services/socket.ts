import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(
    import.meta.env.VITE_WS_URL ||
    window.location.origin.replace(':3000', ':4000'),
    {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    }
  );

  // No console.log — silent connection management
  socket.on('connect_error', () => {
    // Silently handle — UI shows connection status via polling getSocket()
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;
