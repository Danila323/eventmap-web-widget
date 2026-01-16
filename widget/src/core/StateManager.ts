/**
 * Менеджер состояния виджета.
 */
import type { WidgetState, StateListener } from '../types';

export class StateManager {
  private state: WidgetState;
  private listeners: StateListener[] = [];

  constructor(initialState: Partial<WidgetState> = {}) {
    this.state = {
      config: null,
      events: [],
      filters: {
        period: 'all',
        search: '',
      },
      isLoading: false,
      error: null,
      ...initialState,
    };
  }

  /**
   * Получить текущее состояние.
   */
  getState(): WidgetState {
    return { ...this.state };
  }

  /**
   * Обновить состояние.
   */
  setState(updates: Partial<WidgetState>): void {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  /**
   * Обновить фильтры.
   */
  setFilters(filters: Partial<WidgetState['filters']>): void {
    this.state.filters = { ...this.state.filters, ...filters };
    this.notify();
  }

  /**
   * Подписаться на изменения состояния.
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    // Возвращаем функцию для отмены подписки
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Уведомить всех подписчиков.
   */
  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  /**
   * Сбросить состояние.
   */
  reset(): void {
    this.state = {
      config: null,
      events: [],
      filters: {
        period: 'all',
        search: '',
      },
      isLoading: false,
      error: null,
    };
    this.notify();
  }
}
