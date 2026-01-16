/**
 * Компонент предпросмотра виджета.
 * Отображает виджет в реальном времени с настройками.
 * Использует Yandex Maps для предпросмотра.
 */
import { useEffect, useRef, useState } from 'react';
import { eventsApi } from '../../services/events';
import type { WidgetConfigCreate, Event } from '../../types';

interface WidgetPreviewProps {
  config: WidgetConfigCreate;
  eventIds?: string[]; // Список ID событий для отображения
}

const parseHeight = (height: string): number => {
  // Парсим высоту типа "400px" в число
  const match = height.match(/(\d+)/);
  return match ? parseInt(match[1]) : 400;
};

// Глобальные типы для Yandex Maps
declare global {
  interface Window {
    ymaps: any;
    yandexMapsLoading?: Promise<void>;
  }
}

// Глобальный флаг для предотвращения повторной загрузки скрипта
let isYandexMapsScriptLoading = false;
let yandexMapsLoadPromise: Promise<void> | null = null;

export const WidgetPreview = ({ config, eventIds = [] }: WidgetPreviewProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  const heightValue = parseHeight(config.height || '400px');
  const mapHeight = Math.max(heightValue - 120, 150); // Вычитаем примерную высоту заголовка и фильтров

  // Загружаем события
  useEffect(() => {
    if (!eventIds || eventIds.length === 0) {
      setEvents([]);
      return;
    }

    const loadEvents = async () => {
      setIsLoadingEvents(true);
      try {
        // Загружаем все события и фильтруем по ID
        const response = await eventsApi.list({
          page: 1,
          page_size: 1000,
        });

        // Фильтруем события по переданным ID
        const filteredEvents = response.items.filter((event) =>
          eventIds.includes(event.id)
        );
        setEvents(filteredEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    loadEvents();
  }, [eventIds]);

  // Загрузка Yandex Maps API
  useEffect(() => {
    // Если Yandex Maps уже загружен
    if (window.ymaps) {
      setIsMapLoaded(true);
      return;
    }

    // Если скрипт уже загружается глобально, используем существующий promise
    if (window.yandexMapsLoading) {
      window.yandexMapsLoading.then(() => {
        setIsMapLoaded(true);
      });
      return;
    }

    // Если скрипт уже есть в DOM, но ещё не загрузился
    const existingScript = document.getElementById('yandex-maps-preview-script');
    if (existingScript) {
      return;
    }

    // Создаём promise для загрузки скрипта только один раз
    if (!isYandexMapsScriptLoading) {
      isYandexMapsScriptLoading = true;

      yandexMapsLoadPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.id = 'yandex-maps-preview-script';
        script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${import.meta.env.VITE_YANDEX_MAPS_API_KEY || ''}`;
        script.async = true;

        script.onload = () => {
          window.ymaps.ready(() => {
            setIsMapLoaded(true);
            resolve();
          });
        };

        script.onerror = () => {
          setLoadError('Не удалось загрузить карту');
          reject(new Error('Failed to load Yandex Maps'));
        };

        document.head.appendChild(script);
      });

      // Сохраняем promise в window для других компонентов
      window.yandexMapsLoading = yandexMapsLoadPromise;
    }
  }, []);

  // Инициализация карты и маркеров
  useEffect(() => {
    if (!isMapLoaded || !mapContainerRef.current || !window.ymaps) {
      return;
    }

    const initMap = () => {
      try {
        // Если карта уже создана, уничтожаем её
        if (mapInstanceRef.current) {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        }

        // Определяем центр карты
        let center: [number, number] = config.center_lat && config.center_lon
          ? [config.center_lat, config.center_lon]
          : [55.755814, 37.617635]; // Москва по умолчанию

        // Если есть события, центрируем карту по ним
        if (events.length > 0) {
          const avgLat = events.reduce((sum, e) => sum + e.latitude, 0) / events.length;
          const avgLon = events.reduce((sum, e) => sum + e.longitude, 0) / events.length;
          center = [avgLat, avgLon];
        }

        // Создаём карту
        const map = new window.ymaps.Map(mapContainerRef.current, {
          center,
          zoom: config.zoom_level || 10,
          controls: [],
        });

        // Добавляем маркеры для каждого события
        events.forEach((event) => {
          // Формируем содержимое балуна
          const balloonContent = `
            <div style="max-width: 300px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${event.title}</h3>
              ${event.venue_name ? `<p style="margin: 4px 0; color: #666;">📍 ${event.venue_name}</p>` : ''}
              ${event.event_datetime ? `<p style="margin: 4px 0; color: #666;">📅 ${new Date(event.event_datetime).toLocaleString('ru-RU')}</p>` : ''}
              ${event.description ? `<p style="margin: 8px 0; font-size: 14px;">${event.description.substring(0, 150)}${event.description.length > 150 ? '...' : ''}</p>` : ''}
              ${event.ticket_url ? `<a href="${event.ticket_url}" target="_blank" style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: ${config.primary_color || '#007bff'}; color: white; text-decoration: none; border-radius: 4px; font-size: 13px;">Купить билет</a>` : ''}
            </div>
          `;

          const placemark = new window.ymaps.Placemark(
            [event.latitude, event.longitude],
            {
              balloonContent,
              hintContent: event.title,
            },
            {
              preset: 'islands#circleDotIcon',
              iconColor: config.marker_color || '#ff0000',
            }
          );

          map.geoObjects.add(placemark);
        });

        // Если есть несколько событий, подгоняем границы карты
        if (events.length > 1) {
          const bounds = map.geoObjects.getBounds();
          if (bounds) {
            map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 });
          }
        }

        mapInstanceRef.current = map;
      } catch (error) {
        console.error('Error initializing map:', error);
        setLoadError('Ошибка инициализации карты');
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [isMapLoaded, events, config.center_lat, config.center_lon, config.zoom_level, config.marker_color, config.primary_color]);

  return (
    <div className="space-y-4 w-full" data-testid="widget-preview">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Предпросмотр</h3>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {config.width} × {config.height}
          </span>
          {events.length > 0 && (
            <span className="text-sm text-gray-600">
              {events.length} {events.length === 1 ? 'событие' : events.length < 5 ? 'события' : 'событий'}
            </span>
          )}
        </div>
      </div>

      {/* Контейнер предпросмотра */}
      <div
        className="border border-gray-300 rounded-lg bg-white overflow-hidden flex flex-col"
        style={{
          width: '100%',
          maxWidth: config.width === '100%' ? '100%' : config.width,
          height: `${heightValue}px`,
        }}
      >
        {/* Заголовок виджета */}
        <div
          className="px-4 py-3 text-white font-semibold flex-shrink-0"
          style={{ backgroundColor: config.primary_color || '#007bff' }}
        >
          {config.title || 'Мероприятия'}
        </div>

        {/* Фильтры */}
        {(config.show_search || config.show_filters) && (
          <div className="flex gap-2 p-3 border-b bg-white flex-shrink-0">
            {config.show_search && (
              <input
                type="text"
                placeholder="Поиск..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none"
                disabled
              />
            )}
            {config.show_filters && (
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none"
                disabled
              >
                <option>Все события</option>
                <option>Сегодня</option>
                <option>Завтра</option>
                <option>Неделя</option>
              </select>
            )}
          </div>
        )}

        {/* Карта */}
        <div
          ref={mapContainerRef}
          className="relative bg-gray-100 flex-1"
          style={{ height: `${mapHeight}px` }}
        >
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <div className="text-center text-gray-600">
                <div className="text-lg font-medium">Карта недоступна</div>
                <div className="text-sm mt-1">{loadError}</div>
              </div>
            </div>
          )}
          {!isMapLoaded && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <div className="text-center text-gray-600">
                <div className="text-lg font-medium">Загрузка карты...</div>
              </div>
            </div>
          )}
          {isMapLoaded && !loadError && events.length === 0 && !isLoadingEvents && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <div className="text-center text-gray-600">
                <div className="text-lg font-medium">Нет событий для отображения</div>
                <div className="text-sm mt-1">Выберите события в форме выше</div>
              </div>
            </div>
          )}
          {isLoadingEvents && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <div className="text-center text-gray-600">
                <div className="text-lg font-medium">Загрузка событий...</div>
              </div>
            </div>
          )}
        </div>

        {/* Информация о виджете */}
        <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-t flex justify-between flex-shrink-0">
          <span>
            {config.show_search && '🔍 Поиск '}
            {config.show_filters && '⏱ Фильтры '}
            {config.show_categories && '🏷 Категории'}
            {!config.show_search && !config.show_filters && !config.show_categories && 'Минимальный режим'}
          </span>
          {config.auto_refresh && <span>🔄 Автообновление</span>}
        </div>
      </div>

      <p className="text-xs text-gray-500">
        💡 Это предпросмотр. Сохраните виджет, чтобы получить код для вставки на сайт.
      </p>
    </div>
  );
};
