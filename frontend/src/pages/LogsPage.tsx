import { format } from 'date-fns';
import { useLogs } from '../hooks/useLogs';
import { LogFiltersBar } from '../components/dashboard/LogFiltersBar';
import { LogLevelBadge, PageHeader, LoadingState, ErrorState, EmptyState } from '../components/ui';
import { Log } from '../types';
import { useState } from 'react';
import { getErrorMessage } from '../services/apiClient';

export const LogsPage = () => {
  const { data, isLoading, isError, error, filters, updateFilters, setPage, refetch } = useLogs({ limit: 50 });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const logs = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Log Explorer"
        description="Search, filter, and inspect all ingested logs"
      />

      <LogFiltersBar
        filters={filters}
        onChange={updateFilters}
        totalCount={meta?.total}
      />

      <div className="flex-1 overflow-y-auto">
        {isLoading && <LoadingState message="Fetching logs..." />}
        {isError && (
          <ErrorState
            message={getErrorMessage(error)}
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && logs.length === 0 && (
          <EmptyState
            icon="📭"
            title="No logs found"
            description="Try adjusting your filters or wait for new logs to be ingested."
          />
        )}

        {!isLoading && logs.length > 0 && (
          <div className="font-mono text-xs">
            {/* Header row */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-surface-2 text-gray-500 text-xs uppercase tracking-wider sticky top-0 z-10">
              <span className="w-36 shrink-0">Timestamp</span>
              <span className="w-16 shrink-0">Level</span>
              <span className="w-24 shrink-0">Source</span>
              <span className="flex-1">Message</span>
              <span className="w-8 shrink-0">Meta</span>
            </div>

            {logs.map((log) => (
              <LogTableRow
                key={log.id}
                log={log}
                expanded={expandedId === log.id}
                onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-1">
          <span className="text-xs text-gray-500">
            Page {meta.page} of {meta.totalPages} — {meta.total.toLocaleString()} total
          </span>
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost text-sm disabled:opacity-40"
              disabled={!meta.hasPrevPage}
              onClick={() => setPage(meta.page - 1)}
            >
              ← Prev
            </button>
            <span className="text-xs text-gray-500 px-2">{meta.page}</span>
            <button
              className="btn-ghost text-sm disabled:opacity-40"
              disabled={!meta.hasNextPage}
              onClick={() => setPage(meta.page + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const LogTableRow = ({ log, expanded, onToggle }: {
  log: Log; expanded: boolean; onToggle: () => void;
}) => {
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

  return (
    <>
      <div
        className="log-row cursor-pointer group"
        onClick={onToggle}
      >
        <span className="w-36 shrink-0 text-gray-500">
          {format(new Date(log.timestamp), 'MMM dd HH:mm:ss')}
        </span>
        <span className="w-16 shrink-0">
          <LogLevelBadge level={log.level} />
        </span>
        <span className="w-24 shrink-0 text-gray-600 truncate">
          {log.source || '—'}
        </span>
        <span className={`flex-1 text-gray-200 ${expanded ? 'whitespace-pre-wrap' : 'truncate'}`}>
          {log.message}
        </span>
        <span className="w-8 shrink-0 text-gray-600 text-center">
          {hasMetadata ? (expanded ? '▲' : '▼') : ''}
        </span>
      </div>

      {expanded && (
        <div className="px-4 py-3 bg-surface-2/50 border-b border-border animate-fade-in">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <span className="text-gray-500 text-xs uppercase tracking-wider">Log ID</span>
              <p className="text-gray-300 font-mono text-xs mt-1">{log.id}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs uppercase tracking-wider">Created At</span>
              <p className="text-gray-300 font-mono text-xs mt-1">
                {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss.SSS')}
              </p>
            </div>
          </div>
          {hasMetadata && (
            <div>
              <span className="text-gray-500 text-xs uppercase tracking-wider">Metadata</span>
              <pre className="mt-2 text-xs text-gray-300 bg-surface-1 rounded-lg p-3 overflow-x-auto border border-border max-h-60">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </>
  );
};
