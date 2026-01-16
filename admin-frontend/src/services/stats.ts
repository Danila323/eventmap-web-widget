/**
 * API сервис для получения статистики.
 */
import { api } from './api';

export interface StatsResponse {
  events: {
    total: number;
    published: number;
  };
  widgets: number;
  api_keys: number;
}

export const statsApi = {
  /**
   * Получить статистику пользователя.
   */
  get: async (): Promise<StatsResponse> => {
    const response = await api.get<StatsResponse>('/stats');
    return response.data;
  },
};
