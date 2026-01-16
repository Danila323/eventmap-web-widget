/**
 * Главный класс виджета.
 */
import { StateManager } from './StateManager';
import { MapService } from '../map';
import { FilterBar } from '../filters';
import type { WidgetConfig, WidgetDataResponse, WidgetEvent } from '../types';

// Генерируем уникальный ID для виджета
const generateWidgetId = () => `eventmap-${Math.random().toString(36).slice(2, 10)}`;

export class Widget {
  private container: HTMLElement;
  private widgetElement: HTMLElement = null!;
  private config: WidgetConfig;
  private stateManager: StateManager;
  private mapService: MapService | null = null;
  private filterBar: FilterBar | null = null;
  private apiBaseUrl: string;
  private isDestroyed = false;
  private widgetId: string;

  constructor(container: HTMLElement | string, config: WidgetConfig) {
    // Получаем контейнер
    if (typeof container === 'string') {
      const element = document.getElementById(container);
      if (!element) {
        throw new Error(`Container #${container} not found`);
      }
      this.container = element;
    } else {
      this.container = container;
    }

    // Генерируем уникальный ID
    this.widgetId = generateWidgetId();

    // Конфигурация по умолчанию
    this.config = {
      width: '100%',
      height: '400px',
      primaryColor: '#007bff',
      markerColor: '#ff0000',
      defaultPeriod: 'all',
      showSearch: true,
      showFilters: true,
      showCategories: true,
      zoomLevel: 10,
      ...config,
    };

    // Создаём менеджер состояния
    this.stateManager = new StateManager();

    // Определяем базовый URL API
    this.apiBaseUrl = this.getApiBaseUrl();

    // Подписываемся на изменения состояния
    this.stateManager.subscribe((state) => this.onStateChange(state));
  }

  /**
   * Инициализировать виджет.
   */
  async mount(): Promise<void> {
    if (this.isDestroyed) return;

    // Очищаем контейнер
    this.container.innerHTML = '';

    // Добавляем стили
    this.addStyles();

    // Создаём структуру
    this.createStructure();

    // Загружаем данные
    await this.loadData();
  }

  /**
   * Уничтожить виджет.
   */
  unmount(): void {
    this.isDestroyed = true;

    if (this.mapService) {
      this.mapService.destroy();
      this.mapService = null;
    }

    if (this.filterBar) {
      this.filterBar.destroy();
      this.filterBar = null;
    }

    // Удаляем стили
    const existingStyles = document.getElementById(`${this.widgetId}-styles`);
    if (existingStyles) {
      existingStyles.remove();
    }

    // Очищаем контейнер
    this.container.innerHTML = '';
  }

  /**
   * Получить базовый URL API.
   */
  private getApiBaseUrl(): string {
    // Пытаемся получить URL из скрипта
    const script = document.querySelector('script[data-widget-key]') as HTMLScriptElement;
    if (script && script.src) {
      const url = new URL(script.src);
      return `${url.protocol}//${url.host}/api/v1`;
    }

    // Fallback на текущий домен
    return `${window.location.protocol}//${window.location.host}/api/v1`;
  }

  /**
   * Добавить стили в head.
   */
  private addStyles(): void {
    // Проверяем, есть ли уже наши стили
    const existingStyles = document.getElementById(`${this.widgetId}-styles`);
    if (existingStyles) {
      existingStyles.remove();
    }

    const style = document.createElement('style');
    style.id = `${this.widgetId}-styles`;

    // Используем CSS с сервера или генерируем свой
    let baseCSS = '';
    if (this.config.css) {
      // Заменяем плейсхолдер {widget-id} на реальный ID
      baseCSS = this.config.css.replace(/\{widget-id\}/g, this.widgetId);
    } else {
      // Fallback - генерируем базовые стили
      baseCSS = `
      #${this.widgetId} {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        background: #ffffff;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        overflow: hidden;
        width: ${this.config.width || '100%'};
        height: ${this.config.height || '400px'};
        display: flex;
        flex-direction: column;
      }
      #${this.widgetId} .eventmap-header {
        padding: 12px 16px;
        color: white;
        font-weight: 600;
        font-size: 16px;
        flex-shrink: 0;
        background-color: ${this.config.primaryColor || '#007bff'};
      }
      #${this.widgetId} .eventmap-filters {
        display: flex;
        gap: 8px;
        padding: 12px;
        background: white;
        border-bottom: 1px solid #e5e7eb;
        flex-shrink: 0;
      }
      #${this.widgetId} .eventmap-filter-select,
      #${this.widgetId} .eventmap-filter-input {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        background: white;
      }
      #${this.widgetId} .eventmap-filter-input {
        flex: 1;
      }
      #${this.widgetId} .eventmap-map {
        width: 100%;
        flex: 1;
        min-height: 300px;
      }
      #${this.widgetId} .eventmap-footer {
        background: #f9fafb;
        padding: 8px 16px;
        font-size: 12px;
        color: #6b7280;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        flex-shrink: 0;
      }
      `;
    }

    // Добавляем дополнительные стили, которых нет в базовом CSS
    const additionalCSS = `
      #${this.widgetId} .eventmap-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #6c757d;
      }
      #${this.widgetId} .eventmap-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #6c757d;
        text-align: center;
        padding: 20px;
      }
      @keyframes ${this.widgetId}-spin {
        to { transform: rotate(360deg); }
      }
      #${this.widgetId} .eventmap-spinner {
        width: 24px;
        height: 24px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid ${this.config.primaryColor || '#007bff'};
        border-radius: 50%;
        animation: ${this.widgetId}-spin 1s linear infinite;
      }
      #${this.widgetId} .eventmap-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #dc3545;
        text-align: center;
        padding: 20px;
        gap: 8px;
      }
      #${this.widgetId} .eventmap-error p {
        margin: 0;
        font-weight: 500;
      }
      #${this.widgetId} .eventmap-error small {
        color: #6c757d;
      }
      /* Leaflet стили для виджета */
      #${this.widgetId} .leaflet-container {
        width: 100%;
        height: 100%;
      }
      #${this.widgetId} .leaflet-popup-content-wrapper {
        border-radius: 8px;
      }
      #${this.widgetId} .leaflet-popup-tip {
        box-shadow: 0 3px 14px rgba(0,0,0,0.2);
      }
    `;

    style.textContent = baseCSS + additionalCSS;
    document.head.appendChild(style);
  }

  /**
   * Создать структуру виджета.
   */
  private createStructure(): void {
    const widget = document.createElement('div');
    widget.id = this.widgetId;

    // Заголовок виджета
    const header = document.createElement('div');
    header.className = 'eventmap-header';
    header.textContent = this.config.title || 'Мероприятия';
    widget.appendChild(header);

    // Контейнер для фильтров (только если есть что показывать)
    let filtersContainer: HTMLElement | null = null;
    if (this.config.showSearch || this.config.showFilters || this.config.showCategories) {
      filtersContainer = document.createElement('div');
      filtersContainer.className = 'eventmap-filters';
      widget.appendChild(filtersContainer);
    }

    // Контейнер для карты
    const mapContainer = document.createElement('div');
    mapContainer.className = 'eventmap-map';
    mapContainer.innerHTML = '<div class="eventmap-loading"><div class="eventmap-spinner"></div></div>';
    widget.appendChild(mapContainer);

    // Футер с информацией о виджете
    const footer = document.createElement('div');
    footer.className = 'eventmap-footer';
    const features = document.createElement('div');
    features.className = 'eventmap-footer-features';

    const featuresToShow: string[] = [];
    if (this.config.showSearch) featuresToShow.push('🔍 Поиск');
    if (this.config.showFilters) featuresToShow.push('⏱ Фильтры');
    if (this.config.showCategories) featuresToShow.push('🏷 Категории');
    if (featuresToShow.length === 0) featuresToShow.push('Минимальный режим');

    features.textContent = featuresToShow.join(' ');
    footer.appendChild(features);

    if (this.config.autoRefresh) {
      const autoRefresh = document.createElement('span');
      autoRefresh.textContent = '🔄 Автообновление';
      footer.appendChild(autoRefresh);
    }

    widget.appendChild(footer);

    this.widgetElement = widget;
    this.container.appendChild(widget);
  }

  /**
   * Загрузить данные с API.
   */
  private async loadData(): Promise<void> {
    this.stateManager.setState({ isLoading: true, error: null });

    try {
      // Строим URL с параметрами фильтрации
      const params = new URLSearchParams();
      params.append('period', this.config.defaultPeriod || 'all');

      const url = `${this.apiBaseUrl}/widget/${this.config.apiKey}?${params.toString()}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load widget data');
      }

      const data: WidgetDataResponse = await response.json();

      // Обновляем состояние
      this.stateManager.setState({
        config: data.config,
        events: data.events,
        isLoading: false,
        error: null,
      });

      // Инициализируем карту после получения данных
      await this.initMap(data.events);

      // Инициализируем фильтры
      this.initFilters(data.events);

    } catch (error) {
      this.stateManager.setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      });
      this.showError();
    }
  }

  /**
   * Инициализировать карту.
   */
  private async initMap(events: WidgetEvent[]): Promise<void> {
    const mapContainer = this.widgetElement.querySelector('.eventmap-map') as HTMLElement;
    if (!mapContainer) return;

    // Очищаем контейнер
    mapContainer.innerHTML = '';

    // Определяем центр карты
    const center: [number, number] = this.config.centerLat && this.config.centerLon
      ? [this.config.centerLat, this.config.centerLon]
      : events.length > 0
      ? [events[0].latitude, events[0].longitude]
      : [55.7558, 37.6173]; // Москва по умолчанию

    try {
      this.mapService = new MapService({
        container: mapContainer,
        center,
        zoom: this.config.zoomLevel || 10,
        apiKey: this.config.yandexMapsApiKey,
        onMarkerClick: (event) => this.onMarkerClick(event),
      });

      await this.mapService.init();
      this.mapService.updateMarkers(events);

      if (events.length > 1) {
        this.mapService.fitToBounds();
      }

    } catch (error) {
      mapContainer.innerHTML = `
        <div class="eventmap-error">
          <p>Не удалось загрузить карту</p>
          <small>${error instanceof Error ? error.message : 'Unknown error'}</small>
        </div>
      `;
    }
  }

  /**
   * Инициализировать фильтры.
   */
  private initFilters(events: WidgetEvent[]): void {
    const filtersContainer = this.widgetElement.querySelector('.eventmap-filters') as HTMLElement;
    if (!filtersContainer) return;

    // Получаем уникальные категории
    const categories: string[] = [...new Set(events.map((e) => e.category).filter((c): c is string => Boolean(c)))];

    this.filterBar = new FilterBar(
      filtersContainer,
      (filters) => this.onFilterChange(filters),
      {
        showPeriod: this.config.showFilters,
        showSearch: this.config.showSearch,
        showCategories: this.config.showCategories && categories.length > 0,
        categories,
      }
    );

    this.filterBar.render();
  }

  /**
   * Обработать изменение фильтров.
   */
  private async onFilterChange(filters: Partial<{ period: 'all' | 'today' | 'tomorrow' | 'week'; category: string; search: string }>): Promise<void> {
    this.stateManager.setFilters(filters);

    // Перезагружаем данные с новыми фильтрами
    const params = new URLSearchParams();

    const currentFilters = this.stateManager.getState().filters;
    if (currentFilters.period) {
      params.append('period', currentFilters.period);
    }
    if (currentFilters.category) {
      params.append('category', currentFilters.category);
    }
    if (currentFilters.search) {
      params.append('search', currentFilters.search);
    }

    try {
      const url = `${this.apiBaseUrl}/widget/${this.config.apiKey}?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load filtered data');

      const data: WidgetDataResponse = await response.json();

      this.stateManager.setState({ events: data.events });

      if (this.mapService) {
        this.mapService.updateMarkers(data.events);

        if (data.events.length > 0) {
          this.mapService.fitToBounds();
        }
      }

    } catch (error) {
      console.error('Filter error:', error);
    }
  }

  /**
   * Обработать клик по метке.
   */
  private onMarkerClick(event: WidgetEvent): void {
    // Можно показать popup или выполнить другое действие
    console.log('Marker clicked:', event);
  }

  /**
   * Обработать изменение состояния.
   */
  private onStateChange(state: { events: WidgetEvent[]; isLoading: boolean; error: string | null }): void {
    if (state.error) {
      this.showError();
    } else if (state.events.length === 0 && !state.isLoading) {
      this.showEmpty();
    }
  }

  /**
   * Показать ошибку.
   */
  private showError(): void {
    const mapContainer = this.widgetElement.querySelector('.eventmap-map') as HTMLElement;
    if (!mapContainer) return;

    mapContainer.innerHTML = `
      <div class="eventmap-error">
        <p>Не удалось загрузить события</p>
        <small>Проверьте API ключ и попробуйте снова</small>
      </div>
    `;
  }

  /**
   * Показать пустое состояние.
   */
  private showEmpty(): void {
    const mapContainer = this.widgetElement.querySelector('.eventmap-map') as HTMLElement;
    if (!mapContainer) return;

    mapContainer.innerHTML = `
      <div class="eventmap-empty">
        <p style="font-size: 24px; margin-bottom: 12px;">📅</p>
        <p>Нет событий</p>
        <small>Попробуйте изменить фильтры</small>
      </div>
    `;
  }
}
