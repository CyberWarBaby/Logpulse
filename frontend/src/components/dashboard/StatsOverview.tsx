import { LogStats } from '../../types';
import { StatCard } from '../ui';

interface StatsOverviewProps {
  stats: LogStats | undefined;
  isLoading: boolean;
}

export const StatsOverview = ({ stats, isLoading }: StatsOverviewProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat-card animate-pulse">
            <div className="h-3 bg-surface-3 rounded w-20" />
            <div className="h-7 bg-surface-3 rounded w-16 mt-1" />
          </div>
        ))}
      </div>
    );
  }

  const lastHour = stats?.lastHour;
  const lastDay = stats?.lastDay;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total (1h)"
        value={lastHour?.total ?? 0}
        sub={`${lastDay?.total ?? 0} in 24h`}
        icon="📊"
      />
      <StatCard
        label="Error Rate"
        value={`${lastHour?.errorRate ?? 0}%`}
        sub={`${lastHour?.byLevel?.error ?? 0} errors`}
        accent={(lastHour?.errorRate ?? 0) > 10}
        icon="🔴"
      />
      <StatCard
        label="Warnings (1h)"
        value={lastHour?.byLevel?.warn ?? 0}
        sub="anomalies flagged"
        icon="⚠️"
      />
      <StatCard
        label="Debug (1h)"
        value={lastHour?.byLevel?.debug ?? 0}
        sub={`${lastHour?.byLevel?.info ?? 0} info`}
        icon="🔍"
      />
    </div>
  );
};
