/**
 * API сервис для аутентификации.
 */
import api from './api';
import type { User, LoginRequest, RegisterRequest } from '../types';

export const authApi = {
  /**
   * Войти в систему.
   */
  login: async (data: LoginRequest): Promise<{ access_token: string }> => {
    const response = await api.post<{ access_token: string }>('/auth/login', data);
    return response.data;
  },

  /**
   * Зарегистрироваться.
   */
  register: async (data: RegisterRequest): Promise<{ access_token: string }> => {
    const response = await api.post<{ access_token: string }>('/auth/register', data);
    return response.data;
  },

  /**
   * Получить текущего пользователя.
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Обновить токен.
   */
  refreshToken: async (): Promise<{ access_token: string }> => {
    const response = await api.post<{ access_token: string }>('/auth/refresh');
    return response.data;
  },
};
