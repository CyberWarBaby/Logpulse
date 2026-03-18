export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type UserRole = 'ADMIN' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  tenantName?: string;
  tenantSlug?: string;
}

export interface Log {
  id: string;
  message: string;
  level: LogLevel;
  timestamp: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
  source?: string;
  tenantId: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface LogStats {
  lastHour: {
    total: number;
    byLevel: Record<LogLevel, number>;
    errorRate: number;
  };
  lastDay: {
    total: number;
    byLevel: Record<LogLevel, number>;
  };
  logsPerMinute: { time: string; count: number }[];
  generatedAt: string;
}

export interface LogFilters {
  level?: LogLevel | '';
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}