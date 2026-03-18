import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../services/socket';
import { Log } from '../types';

type LogHandler = (log: Log) => void;

export const useSocketLogs = (onNewLog: LogHandler, enabled = true) => {
  const handlerRef = useRef(onNewLog);
  handlerRef.current = onNewLog;

  useEffect(() => {
    if (!enabled) return;
    const socket = getSocket();
    if (!socket) return;

    const handler = (log: Log) => handlerRef.current(log);
    socket.on('log:new', handler);

    return () => {
      socket.off('log:new', handler);
    };
  }, [enabled]);
};

export const useSocketStatus = () => {
  const socketRef = useRef(getSocket());

  const isConnected = useCallback(() => {
    return socketRef.current?.connected ?? false;
  }, []);

  return { isConnected };
};
