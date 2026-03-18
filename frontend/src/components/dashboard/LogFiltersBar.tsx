import { LogFilters, LogLevel } from '../../types';

const LEVELS: { value: LogLevel | ''; label: string }[] = [
  { value: '', label: 'All levels' },
  { value: 'error', label: '🔴 Error' },
  { value: 'warn', label: '⚠️ Warn' },
  { value: 'info', label: '🔵 Info' },
  { value: 'debug', label: '🟣 Debug' },
];

interface LogFiltersBarProps {
  filters: LogFilters;
  onChange: (update: Partial<LogFilters>) => void;
  totalCount?: number;
}

export const LogFiltersBar = ({ filters, onChange, totalCount }: LogFiltersBarProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-surface-1 border-b border-border">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
        <input
          type="text"
          className="input pl-8 py-2 text-sm"
          placeholder="Search messages..."
          value={filters.search || ''}
          onChange={(e) => onChange({ search: e.target.value || undefined })}
        />
      </div>

      {/* Level filter */}
      <select
        className="input py-2 text-sm w-36"
        value={filters.level || ''}
        onChange={(e) => onChange({ level: (e.target.value as LogLevel) || undefined })}
      >
        {LEVELS.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>

      {/* Date range */}
      <div className="flex items-center gap-2">
        <input
          type="datetime-local"
          className="input py-2 text-sm text-gray-400"
          value={filters.from ? filters.from.replace('Z', '') : ''}
          onChange={(e) => onChange({ from: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
          title="From"
        />
        <span className="text-gray-600 text-xs">→</span>
        <input
          type="datetime-local"
          className="input py-2 text-sm text-gray-400"
          value={filters.to ? filters.to.replace('Z', '') : ''}
          onChange={(e) => onChange({ to: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
          title="To"
        />
      </div>

      {/* Clear filters */}
      {(filters.search || filters.level || filters.from || filters.to) && (
        <button
          onClick={() => onChange({ search: undefined, level: undefined, from: undefined, to: undefined })}
          className="text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded hover:bg-surface-3"
        >
          Clear ×
        </button>
      )}

      {/* Count */}
      {totalCount !== undefined && (
        <span className="text-xs text-gray-500 ml-auto">{totalCount.toLocaleString()} results</span>
      )}
    </div>
  );
};
