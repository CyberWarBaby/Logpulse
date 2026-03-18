import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { logsApi } from '../services/api';
import { Log, LogFilters } from '../types';
import { useSocketLogs } from './useSocketLogs';

const QUERY_KEY = 'logs';
const MAX_LIVE_LOGS = 200;

export const useLogs = (initialFilters: LogFilters = {}) => {
  const [filters, setFilters] = useState<LogFilters>(initialFilters);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: () => logsApi.getLogs(filters).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const updateFilters = useCallback((update: Partial<LogFilters>) => {
    setFilters((prev) => ({ ...prev, ...update, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  return { ...query, filters, updateFilters, setPage };
};

export const useLiveLogs = (streamActive: boolean) => {
  const queryClient = useQueryClient();

  const addLog = useCallback((log: Log) => {
    queryClient.setQueryData<Log[]>(['live-logs'], (prev = []) => {
      const updated = [log, ...prev];
      return updated.slice(0, MAX_LIVE_LOGS);
    });
  }, [queryClient]);

  const { data: recentQuery } = useQuery({
    queryKey: ['live-logs-init'],
    queryFn: () => logsApi.getRecentLogs().then((r) => r.data.data),
    onSuccess: (logs: Log[]) => {
      queryClient.setQueryData(['live-logs'], logs);
    },
  } as any);

  useSocketLogs(addLog, streamActive);

  const liveLogs = queryClient.getQueryData<Log[]>(['live-logs']) ?? [];

  return { liveLogs };
};
