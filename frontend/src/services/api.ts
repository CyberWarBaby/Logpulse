import { api } from './apiClient';
import { ApiResponse, PaginatedResponse, Log, LogFilters, LogStats, ApiKey, User, Tenant } from '../types';

// Auth
export const authApi = {
  register: (data: { email: string; password: string; name: string; organizationName: string }) =>
    api.post<ApiResponse<{ token: string; user: User }>>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', data),
  getMe: () => api.get<ApiResponse<User>>('/auth/me'),
};

// Logs
export const logsApi = {
  getLogs: (filters: LogFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) params.set(k, String(v));
    });
    return api.get<PaginatedResponse<Log>>(`/logs?${params}`);
  },
  getRecentLogs: () => api.get<ApiResponse<Log[]>>('/logs/recent'),
};

// Analytics
export const analyticsApi = {
  getStats: () => api.get<ApiResponse<LogStats>>('/analytics/stats'),
};

// Tenants / API Keys
export const tenantApi = {
  getTenant: () => api.get<ApiResponse<Tenant>>('/tenants'),
  getApiKeys: () => api.get<ApiResponse<ApiKey[]>>('/tenants/api-keys'),
  createApiKey: (name: string) =>
    api.post<ApiResponse<{ rawKey: string; id: string }>>('/tenants/api-keys', { name }),
  revokeApiKey: (id: string) => api.delete<ApiResponse<{ revoked: boolean }>>(`/tenants/api-keys/${id}`),
};

// Users
export const usersApi = {
  getUsers: () => api.get<ApiResponse<User[]>>('/users'),
  updateRole: (userId: string, role: string) =>
    api.patch<ApiResponse<{ updated: boolean }>>(`/users/${userId}/role`, { role }),
  removeUser: (userId: string) => api.delete<ApiResponse<{ removed: boolean }>>(`/users/${userId}`),
};
