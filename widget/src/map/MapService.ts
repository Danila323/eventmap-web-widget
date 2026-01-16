/**
 * Сервис для работы с Яндекс Картами API.
 */
import type { WidgetEvent } from '../types';

export interface MapOptions {
  container: HTMLElement;
  center: [number, number];
  zoom: number;
  apiKey?: string;
  onMarkerClick?: (event: WidgetEvent) => void;
}

export class MapService {
  private map: any = null;
  private markers: Map<string, any> = new Map();
  private container: HTMLElement;
  private onMarkerClick?: (event: WidgetEvent) => void;
  private apiKey?: string;

  constructor(private options: MapOptions) {
    this.container = options.container;
    this.onMarkerClick = options.onMarkerClick;
    this.apiKey = options.apiKey;
  }

  /**
   * Инициализировать карту.
   */
  async init(): Promise<void> {
    // Загружаем Yandex Maps API
    await this.loadYandexMaps();

    return new Promise((resolve) => {
      // Инициализируем карту
      this.map = new window.ymaps!.Map(this.container, {
        center: this.options.center,
        zoom: this.options.zoom,
        controls: ['zoomControl', 'fullscreenControl'],
      }, {
        suppressMapOpenBlock: true, // Скрываем кнопку "Открыть в Яндекс Картах"
      });

      resolve();
    });
  }

  /**
   * Загрузить Yandex Maps API.
   */
  private loadYandexMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Проверяем, загружен ли уже скрипт Яндекс Карт
      const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');

      // Если API уже загружен
      if (typeof window.ymaps !== 'undefined' && window.ymaps.ready) {
        window.ymaps.ready(() => resolve());
        return;
      }

      // Если скрипт уже есть на странице, но ещё не загрузился
      if (existingScript) {
        window.ymaps!.ready(() => resolve());
        return;
      }

      // Загружаем API
      const script = document.createElement('script');
      const apiKey = this.apiKey ? `&apikey=${this.apiKey}` : '';
      script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${apiKey}`;
      script.async = true;
      script.onload = () => {
        window.ymaps!.ready(() => resolve());
      };
      script.onerror = () => reject(new Error('Failed to load Yandex Maps API'));
      document.head.appendChild(script);
    });
  }

  /**
   * Добавить метку на карту.
   */
  addMarker(event: WidgetEvent): void {
    if (!this.map) return;

    // Если метка уже существует, удаляем её
    this.removeMarker(event.id);

    // Создаем popup содержимое
    const popupContent = this.createPopupContent(event);

    // Создаем placemark
    const placemark = new window.ymaps!.Placemark(
      [event.latitude, event.longitude],
      {
        balloonContent: popupContent,
        hintContent: event.title,
      },
      {
        preset: 'islands#blueDotIcon',
        balloonMaxWidth: 300,
      }
    );

    // Добавляем обработчик клика
    placemark.events.add('click', () => {
      if (this.onMarkerClick) {
        this.onMarkerClick(event);
      }
    });

    this.map.geoObjects.add(placemark);
    this.markers.set(event.id, placemark);
  }

  /**
   * Удалить метку с карты.
   */
  removeMarker(eventId: string): void {
    const marker = this.markers.get(eventId);
    if (marker) {
      this.map.geoObjects.remove(marker);
      this.markers.delete(eventId);
    }
  }

  /**
   * Очистить все метки.
   */
  clearMarkers(): void {
    this.markers.forEach((marker) => {
      this.map.geoObjects.remove(marker);
    });
    this.markers.clear();
  }

  /**
   * Обновить метки на карте.
   */
  updateMarkers(events: WidgetEvent[]): void {
    this.clearMarkers();
    events.forEach((event) => this.addMarker(event));
  }

  /**
   * Установить центр карты.
   */
  setCenter(center: [number, number], zoom?: number): void {
    if (!this.map) return;

    this.map.setCenter(center, zoom);
  }

  /**
   * Подогнать границы под все метки.
   */
  fitToBounds(): void {
    if (!this.map || this.markers.size === 0) return;

    // Получаем границы всех объектов на карте
    const bounds = this.map.geoObjects.getBounds();
    if (!bounds) return;

    // Подгоняем границы
    this.map.setBounds(bounds, {
      checkZoomRange: true,
      zoomMargin: 50,
    });
  }

  /**
   * Уничтожить карту.
   */
  destroy(): void {
    if (this.map) {
      this.map.destroy();
      this.map = null;
      this.markers.clear();
    }
  }

  /**
   * Создать содержимое popup.
   */
  private createPopupContent(event: WidgetEvent): string {
    const date = new Date(event.event_datetime);
    const formattedDate = date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    let content = `
      <div style="padding: 10px; min-width: 200px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #333;">${this.escapeHtml(event.title)}</h3>
    `;

    if (event.venue_name) {
      content += `<p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">📍 ${this.escapeHtml(event.venue_name)}</p>`;
    }

    content += `<p style="margin: 0 0 8px 0; color: #999; font-size: 14px;">📅 ${formattedDate} в ${formattedTime}</p>`;

    if (event.description) {
      content += `<p style="margin: 0 0 12px 0; color: #333; font-size: 14px;">${this.escapeHtml(event.description.slice(0, 100))}${event.description.length > 100 ? '...' : ''}</p>`;
    }

    if (event.ticket_url) {
      content += `<a href="${this.escapeHtml(event.ticket_url)}" target="_blank" style="display: inline-block; padding: 6px 12px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; font-size: 14px;">Купить билет</a>`;
    }

    content += '</div>';
    return content;
  }

  /**
   * Экранировать HTML.
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
