import { useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import type { User, Permissions } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  permissions: Permissions | null;
  loading: boolean;
  error: string | null;
}

/**
 * Хук для управления авторизацией
 * Выполняет авторизацию через Telegram initData и хранит состояние
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    permissions: null,
    loading: false,
    error: null,
  });

  /**
   * Авторизация через Telegram initData
   */
  const login = useCallback(async (initData: string) => {
    if (!initData) {
      setState(prev => ({
        ...prev,
        error: 'Приложение доступно только через Telegram',
        loading: false,
      }));
      return false;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const authResponse = await apiClient.auth(initData);
      apiClient.setToken(authResponse.accessToken);

      const meResponse = await apiClient.getMe();

      setState({
        isAuthenticated: true,
        user: authResponse.user,
        permissions: meResponse.permissions,
        loading: false,
        error: null,
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка авторизации';
      setState({
        isAuthenticated: false,
        user: null,
        permissions: null,
        loading: false,
        error: message,
      });
      return false;
    }
  }, []);

  /**
   * Выход (сброс состояния)
   */
  const logout = useCallback(() => {
    setState({
      isAuthenticated: false,
      user: null,
      permissions: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    login,
    logout,
  };
}
