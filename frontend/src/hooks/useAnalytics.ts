import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/api';

export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics-stats'],
    queryFn: () => analyticsApi.getStats().then((r) => r.data.data),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
};
