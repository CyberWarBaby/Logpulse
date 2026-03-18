import { useAnalytics } from '../hooks/useAnalytics';
import { LogsTimeline, LevelBreakdown, ErrorRateGauge } from '../components/dashboard/Charts';
import { PageHeader, LoadingState, ErrorState, StatCard } from '../components/ui';
import { getErrorMessage } from '../services/apiClient';

export const AnalyticsPage = () => {
  const { data: stats, isLoading, isError, error, refetch } = useAnalytics();

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Analytics"
        description="Visualize log trends, error rates, and system health"
        action={
          <button onClick={() => refetch()} className="btn-ghost text-sm">
            ↻ Refresh
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading && <LoadingState message="Loading analytics..." />}
        {isError && <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />}

        {stats && (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total (24h)"
                value={stats.lastDay.total.toLocaleString()}
                sub="all levels"
                icon="📊"
              />
              <StatCard
                label="Errors (24h)"
                value={(stats.lastDay.byLevel?.error ?? 0).toLocaleString()}
                sub={`${stats.lastHour.byLevel?.error ?? 0} in last hour`}
                accent={(stats.lastDay.byLevel?.error ?? 0) > 0}
                icon="🔴"
              />
              <StatCard
                label="Warnings (24h)"
                value={(stats.lastDay.byLevel?.warn ?? 0).toLocaleString()}
                icon="⚠️"
              />
              <StatCard
                label="Info (24h)"
                value={(stats.lastDay.byLevel?.info ?? 0).toLocaleString()}
                icon="🔵"
              />
            </div>

            {/* Timeline */}
            <LogsTimeline data={stats.logsPerMinute} />

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <ErrorRateGauge rate={stats.lastHour.errorRate} />
              </div>
              <div className="lg:col-span-1">
                <LevelBreakdown byLevel={stats.lastHour.byLevel} title="Last Hour Distribution" />
              </div>
              <div className="lg:col-span-1">
                <LevelBreakdown byLevel={stats.lastDay.byLevel} title="Last 24h Distribution" />
              </div>
            </div>

            {/* Last updated */}
            <p className="text-xs text-gray-600 text-right">
              Generated at {new Date(stats.generatedAt).toLocaleTimeString()} · auto-refreshes every 30s
            </p>
          </>
        )}
      </div>
    </div>
  );
};
