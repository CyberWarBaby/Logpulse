import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; organizationName: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Token is kept in memory only (not localStorage) to prevent XSS token theft.
// sessionStorage holds a flag so the tab can attempt a silent refresh on reload
// without persisting the raw token to storage accessible by JS injections.
let inMemoryToken: string | null = null;

const SESSION_KEY = 'logpulse_session'; // stores only a boolean flag, not the token

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // starts true while we verify session

  // On mount: if sessionStorage flag is set, we had a session — prompt re-login
  // (we can't restore the token; user must log in again after a hard refresh)
  useEffect(() => {
    const hadSession = sessionStorage.getItem(SESSION_KEY);
    if (!hadSession) {
      setIsLoading(false);
    } else {
      // Session flag present but no token in memory = tab was refreshed
      // Just clear loading; user will see login page
      sessionStorage.removeItem(SESSION_KEY);
      setIsLoading(false);
    }
  }, []);

  const setAuth = useCallback((newToken: string, newUser: User) => {
    inMemoryToken = newToken;
    sessionStorage.setItem(SESSION_KEY, '1'); // flag only, NOT the token
    setToken(newToken);
    setUser(newUser);
    connectSocket(newToken);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      setAuth(res.data.data.token, res.data.data.user);
    } finally {
      setIsLoading(false);
    }
  }, [setAuth]);

  const register = useCallback(async (data: {
    email: string; password: string; name: string; organizationName: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      setAuth(res.data.data.token, res.data.data.user);
    } finally {
      setIsLoading(false);
    }
  }, [setAuth]);

  const logout = useCallback(() => {
    inMemoryToken = null;
    sessionStorage.removeItem(SESSION_KEY);
    setToken(null);
    setUser(null);
    disconnectSocket();
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      login, register, logout,
      isAuthenticated: !!inMemoryToken && !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export for use in axios interceptor (reads from memory, not storage)
export const getInMemoryToken = () => inMemoryToken;

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
