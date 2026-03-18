import axios, { AxiosInstance, AxiosError } from 'axios';
import { getInMemoryToken } from '../context/AuthContext';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15_000,
    withCredentials: false,
  });

  // Read token from memory only — never from localStorage
  client.interceptors.request.use((config) => {
    const token = getInMemoryToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Global 401 handler
  client.interceptors.response.use(
    (res) => res,
    (error: AxiosError<{ error: { message: string; code: string } }>) => {
      if (error.response?.status === 401) {
        // Clear memory token and redirect
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const api = createApiClient();

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message || error.message || 'Request failed';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
};
