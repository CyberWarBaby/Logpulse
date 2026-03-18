import { useState, useRef, useEffect } from 'react';
import { Log } from '../../types';
import { LogLevelBadge } from '../ui';
import { format } from 'date-fns';

interface LogStreamProps {
  logs: Log[];
  isLive: boolean;
  onToggleLive: () => void;
}

export const LogStream = ({ logs, isLive, onToggleLive }: LogStreamProps) => {
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(logs.length);

  // Auto-scroll on new logs
  useEffect(() => {
    if (autoScroll && logs.length > prevLengthRef.current && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    prevLengthRef.current = logs.length;
  }, [logs.length, autoScroll]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    setAutoScroll(el.scrollTop < 50);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-1">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs ${isLive ? 'text-emerald-400' : 'text-gray-500'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 live-dot' : 'bg-gray-600'}`} />
            {isLive ? 'Live' : 'Paused'}
          </div>
          <span className="text-xs text-gray-600">|</span>
          <span className="text-xs text-gray-500">{logs.length} entries</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoScroll(true)}
            className={`text-xs px-2 py-1 rounded transition-colors ${autoScroll ? 'text-accent bg-accent/10' : 'text-gray-500 hover:text-white'}`}
          >
            ↑ Auto-scroll
          </button>
          <button
            onClick={onToggleLive}
            className={`text-xs px-3 py-1 rounded border transition-all ${
              isLive
                ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            {isLive ? '⏸ Pause' : '▶ Resume'}
          </button>
        </div>
      </div>

      {/* Log list */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto font-mono text-xs"
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-600">
            Waiting for logs...
          </div>
        ) : (
          logs.map((log, i) => (
            <LogRow
              key={log.id || i}
              log={log}
              isNew={i === 0 && isLive}
              expanded={expandedId === log.id}
              onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

const LogRow = ({
  log, isNew, expanded, onToggle
}: {
  log: Log; isNew: boolean; expanded: boolean; onToggle: () => void;
}) => {
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

  const levelColor: Record<string, string> = {
    info: 'text-blue-400',
    warn: 'text-amber-400',
    error: 'text-red-400',
    debug: 'text-violet-400',
  };

  return (
    <div
      className={`log-row cursor-pointer ${isNew ? 'log-new' : ''}`}
      onClick={onToggle}
    >
      {/* Timestamp */}
      <span className="text-gray-600 shrink-0 w-20 text-right">
        {format(new Date(log.timestamp), 'HH:mm:ss')}
      </span>

      {/* Level indicator bar */}
      <div className={`w-0.5 h-4 rounded-full shrink-0 ${
        log.level === 'error' ? 'bg-red-500' :
        log.level === 'warn' ? 'bg-amber-500' :
        log.level === 'debug' ? 'bg-violet-500' : 'bg-blue-500'
      }`} />

      {/* Level */}
      <span className={`shrink-0 w-12 ${levelColor[log.level] || 'text-blue-400'} font-medium`}>
        {log.level.toUpperCase()}
      </span>

      {/* Source */}
      {log.source && (
        <span className="text-gray-600 shrink-0 text-xs">[{log.source}]</span>
      )}

      {/* Message */}
      <span className={`flex-1 text-gray-200 ${expanded ? '' : 'truncate'}`}>
        {log.message}
      </span>

      {/* Metadata indicator */}
      {hasMetadata && (
        <span className="text-gray-600 shrink-0 text-xs">
          {expanded ? '▲' : '▼'}
        </span>
      )}

      {/* Expanded metadata */}
      {expanded && hasMetadata && (
        <div className="w-full mt-2 ml-[7.5rem] col-span-full">
          <pre className="text-xs text-gray-400 bg-surface-2 rounded p-3 overflow-x-auto border border-border">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
