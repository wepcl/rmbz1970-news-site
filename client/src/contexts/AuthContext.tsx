import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { newsApi } from '@client/src/api';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { NewsUser } from '@shared/api.interface';

interface AuthContextType {
  user: NewsUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName: string, role: 'admin' | 'reader') => Promise<string>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NewsUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await newsApi.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      logger.debug('当前未登录或 token 失效', String(err));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = async (username: string, password: string) => {
    const result = await newsApi.login({ username, password });
    newsApi.setToken(result.token);
    setUser(result.user);
  };

  const register = async (username: string, password: string, displayName: string, role: 'admin' | 'reader') => {
    const result = await newsApi.register({ username, password, displayName, role });
    return result.status;
  };

  const logout = () => {
    newsApi.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
