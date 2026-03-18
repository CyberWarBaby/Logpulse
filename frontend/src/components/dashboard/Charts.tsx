import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { format } from 'date-fns';
import { LogStats } from '../../types';

const COLORS = {
  info: '#3b82f6',
  warn: '#f59e0b',
  error: '#ef4444',
  debug: '#8b5cf6',
};

interface LogsTimelineProps {
  data: LogStats['logsPerMinute'];
}

export const LogsTimeline = ({ data }: LogsTimelineProps) => {
  const formatted = data.map((d) => ({
    time: format(new Date(d.time), 'HH:mm'),
    count: d.count,
  }));

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        📈 <span>Logs per Minute</span>
        <span className="text-xs text-gray-500 font-normal ml-auto">Last 60 min</span>
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={formatted} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="logGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#1c1c1f',
              border: '1px solid #2a2a30',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#e8e8f0',
            }}
            itemStyle={{ color: '#6c63ff' }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#6c63ff"
            strokeWidth={2}
            fill="url(#logGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#6c63ff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface LevelBreakdownProps {
  byLevel: Record<string, number>;
  title?: string;
}

export const LevelBreakdown = ({ byLevel, title = 'Log Levels' }: LevelBreakdownProps) => {
  const data = Object.entries(byLevel)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  if (data.length === 0) return (
    <div className="card p-5 flex items-center justify-center h-48 text-gray-600 text-sm">
      No data available
    </div>
  );

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        🍩 <span>{title}</span>
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS] || '#6b7280'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#1c1c1f',
              border: '1px solid #2a2a30',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#e8e8f0',
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

interface ErrorRateGaugeProps {
  rate: number;
}

export const ErrorRateGauge = ({ rate }: ErrorRateGaugeProps) => {
  const color = rate > 20 ? '#ef4444' : rate > 5 ? '#f59e0b' : '#10b981';
  const status = rate > 20 ? 'Critical' : rate > 5 ? 'Elevated' : 'Healthy';

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        🎯 <span>Error Rate</span>
        <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full`}
          style={{ color, background: `${color}20` }}>
          {status}
        </span>
      </h3>
      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative">
          <svg viewBox="0 0 100 60" className="w-40 h-24">
            {/* Background arc */}
            <path
              d="M 10 55 A 40 40 0 0 1 90 55"
              fill="none" stroke="#2a2a30" strokeWidth="8" strokeLinecap="round"
            />
            {/* Value arc */}
            <path
              d="M 10 55 A 40 40 0 0 1 90 55"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${Math.min(rate, 100) * 1.257} 999`}
              style={{ filter: `drop-shadow(0 0 4px ${color})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <span className="text-2xl font-display font-bold text-white">{rate.toFixed(1)}%</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">of logs in last hour</p>
      </div>
    </div>
  );
};
