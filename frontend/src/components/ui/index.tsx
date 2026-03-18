import React from 'react';

// Spinner
export const Spinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const s = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-8 h-8 border-2' }[size];
  return (
    <div className={`${s} border-surface-3 border-t-accent rounded-full animate-spin`} />
  );
};

// Loading state
export const LoadingState = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
    <Spinner size="lg" />
    <span className="text-sm">{message}</span>
  </div>
);

// Empty state
export const EmptyState = ({ icon = '📭', title, description }: {
  icon?: string; title: string; description?: string;
}) => (
  <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-500">
    <span className="text-4xl">{icon}</span>
    <p className="font-medium text-white mt-2">{title}</p>
    {description && <p className="text-sm text-center max-w-xs">{description}</p>}
  </div>
);

// Error state
export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
    <span className="text-4xl">⚠️</span>
    <p className="text-red-400 font-medium">Something went wrong</p>
    <p className="text-sm text-center max-w-xs">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-primary text-sm mt-2">Try again</button>
    )}
  </div>
);

// Page Header
export const PageHeader = ({
  title, description, action
}: {
  title: string; description?: string; action?: React.ReactNode;
}) => (
  <div className="flex items-start justify-between px-6 py-5 border-b border-border">
    <div>
      <h1 className="font-display font-bold text-xl text-white">{title}</h1>
      {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// Badge component
export const LogLevelBadge = ({ level }: { level: string }) => {
  const classes: Record<string, string> = {
    info:  'badge-info',
    warn:  'badge-warn',
    error: 'badge-error',
    debug: 'badge-debug',
  };
  return <span className={classes[level] || 'badge-info'}>{level}</span>;
};

// Modal
export const Modal = ({
  open, onClose, title, children
}: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-surface-1 border border-border rounded-2xl shadow-2xl w-full max-w-md animate-slide-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// Tooltip
export const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => (
  <div className="relative group inline-flex">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-4 text-xs text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-border">
      {text}
    </div>
  </div>
);

// Stat Card
export const StatCard = ({
  label, value, sub, accent = false, icon
}: {
  label: string; value: string | number; sub?: string; accent?: boolean; icon?: string;
}) => (
  <div className={`stat-card ${accent ? 'border-accent/30 bg-accent/5' : ''}`}>
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</span>
      {icon && <span className="text-lg">{icon}</span>}
    </div>
    <div className={`text-2xl font-display font-bold ${accent ? 'text-accent' : 'text-white'}`}>{value}</div>
    {sub && <div className="text-xs text-gray-500">{sub}</div>}
  </div>
);

// Toast-like notification (simple inline)
export const InlineAlert = ({ type, message }: { type: 'error' | 'success' | 'info'; message: string }) => {
  const styles = {
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  };
  const icons = { error: '⚠️', success: '✅', info: 'ℹ️' };
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${styles[type]}`}>
      <span>{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
};
