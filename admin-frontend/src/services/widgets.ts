/**
 * API сервис для работы с виджетами и API ключами.
 */
import api from './api';
import type {
  WidgetConfig,
  WidgetConfigCreate,
  ApiKey,
  EmbedCode,
} from '../types';

export const widgetsApi = {
  /**
   * Получить список виджетов пользователя.
   */
  list: async (): Promise<WidgetConfig[]> => {
    const response = await api.get<WidgetConfig[]>('/widgets');
    return response.data;
  },

  /**
   * Получить виджет по ID.
   */
  get: async (id: string): Promise<WidgetConfig> => {
    const response = await api.get<WidgetConfig>(`/widgets/${id}`);
    return response.data;
  },

  /**
   * Создать новый виджет.
   */
  create: async (data: WidgetConfigCreate): Promise<WidgetConfig> => {
    const response = await api.post<WidgetConfig>('/widgets', data);
    return response.data;
  },

  /**
   * Обновить виджет.
   */
  update: async (id: string, data: Partial<WidgetConfigCreate>): Promise<WidgetConfig> => {
    const response = await api.put<WidgetConfig>(`/widgets/${id}`, data);
    return response.data;
  },

  /**
   * Удалить виджет.
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/widgets/${id}`);
  },

  /**
   * Сгенерировать embed код.
   */
  generateEmbed: async (configId: string): Promise<EmbedCode> => {
    const response = await api.post<EmbedCode>(`/embed/${configId}`);
    return response.data;
  },
};

export const apiKeysApi = {
  /**
   * Получить список API ключей.
   */
  list: async (): Promise<ApiKey[]> => {
    const response = await api.get<ApiKey[]>('/api-keys');
    return response.data;
  },

  /**
   * Создать новый API ключ.
   */
  create: async (): Promise<ApiKey> => {
    const response = await api.post<ApiKey>('/api-keys');
    return response.data;
  },

  /**
   * Обновить API ключ.
   */
  update: async (id: string, data: { name?: string; allowed_domains?: string[] }): Promise<ApiKey> => {
    const response = await api.patch<ApiKey>(`/api-keys/${id}`, data);
    return response.data;
  },

  /**
   * Удалить API ключ.
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api-keys/${id}`);
  },
};
