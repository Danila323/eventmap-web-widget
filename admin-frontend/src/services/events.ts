/**
 * API сервис для работы с событиями.
 */
import api from './api';
import type {
  Event,
  EventCreate,
  EventUpdate,
  EventListResponse,
  EventFilters,
  GeocodeResponse,
} from '../types';

export const eventsApi = {
  /**
   * Получить список событий с фильтрацией и пагинацией.
   */
  list: async (filters: EventFilters = {}): Promise<EventListResponse> => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.period) params.append('period', filters.period);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.only_published) params.append('only_published', 'true');
    if (filters.widget_id) params.append('widget_id', filters.widget_id);

    const response = await api.get<EventListResponse>(`/events?${params.toString()}`);
    return response.data;
  },

  /**
   * Получить событие по ID.
   */
  get: async (id: string): Promise<Event> => {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },

  /**
   * Создать новое событие.
   */
  create: async (data: EventCreate): Promise<Event> => {
    const response = await api.post<Event>('/events', data);
    return response.data;
  },

  /**
   * Обновить событие.
   */
  update: async (id: string, data: EventUpdate): Promise<Event> => {
    const response = await api.put<Event>(`/events/${id}`, data);
    return response.data;
  },

  /**
   * Удалить событие.
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },

  /**
   * Геокодировать адрес в координаты.
   */
  geocode: async (address: string): Promise<GeocodeResponse> => {
    const response = await api.post<GeocodeResponse>('/geocode', { address });
    return response.data;
  },

  /**
   * Обратное геокодирование (координаты в адрес).
   */
  reverseGeocode: async (longitude: number, latitude: number): Promise<string> => {
    const response = await api.get<{ address: string }>(`/geocode/reverse?longitude=${longitude}&latitude=${latitude}`);
    return response.data.address;
  },
};
