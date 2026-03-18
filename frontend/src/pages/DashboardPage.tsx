import { useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useLiveLogs } from '../hooks/useLogs';
import { StatsOverview } from '../components/dashboard/StatsOverview';
import { LogStream } from '../components/dashboard/LogStream';
import { LogsTimeline } from '../components/dashboard/Charts';
import { PageHeader } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [liveActive, setLiveActive] = useState(true);
  const { data: stats, isLoading: statsLoading } = useAnalytics();
  const { liveLogs } = useLiveLogs(liveActive);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`Good ${getTimeOfDay()}, ${user?.name?.split(' ')[0]} 👋`}
        description={`Monitoring ${user?.tenantName} — real-time log stream`}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats row */}
        <StatsOverview stats={stats} isLoading={statsLoading} />

        {/* Timeline chart */}
        {stats && <LogsTimeline data={stats.logsPerMinute} />}

        {/* Live log stream */}
        <div className="card overflow-hidden" style={{ height: '420px' }}>
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              <span>Live Log Stream</span>
              {liveActive && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
                  Streaming
                </span>
              )}
            </h2>
            <span className="text-xs text-gray-500">{liveLogs.length} / 200 entries</span>
          </div>
          <div className="h-[370px]">
            <LogStream
              logs={liveLogs}
              isLive={liveActive}
              onToggleLive={() => setLiveActive((v) => !v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};
