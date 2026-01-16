/**
 * Форма конфигурации виджета.
 */
import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WidgetConfigCreate } from '../../types';

interface Event {
  id: string;
  title: string;
  event_datetime: string;
}

interface WidgetFormProps {
  initialValues?: WidgetConfigCreate;
  apiKeys: Array<{ id: string; key: string; name?: string }>;
  events: Event[];
  onSubmit: (data: WidgetConfigCreate) => Promise<void>;
  submitButtonText: string;
  isLoading?: boolean;
  onConfigChange?: (config: WidgetConfigCreate) => void;
}

export const WidgetForm = ({ initialValues, apiKeys, events, onSubmit, submitButtonText, isLoading = false, onConfigChange }: WidgetFormProps) => {
  const navigate = useNavigate();

  const [title, setTitle] = useState(initialValues?.title || '');
  const [apiKeyId, setApiKeyId] = useState(initialValues?.api_key_id || '');
  const [width, setWidth] = useState(initialValues?.width || '100%');
  const [height, setHeight] = useState(initialValues?.height || '400px');
  const [primaryColor, setPrimaryColor] = useState(initialValues?.primary_color || '#007bff');
  const [markerColor, setMarkerColor] = useState(initialValues?.marker_color || '#ff0000');
  const [defaultPeriod, setDefaultPeriod] = useState(initialValues?.default_period || 'all');
  const [showSearch, setShowSearch] = useState(initialValues?.show_search ?? true);
  const [showFilters, setShowFilters] = useState(initialValues?.show_filters ?? true);
  const [showCategories, setShowCategories] = useState(initialValues?.show_categories ?? true);
  const [autoRefresh, setAutoRefresh] = useState(initialValues?.auto_refresh ?? false);
  const [zoomLevel, setZoomLevel] = useState(initialValues?.zoom_level || 10);
  const [centerLat, setCenterLat] = useState(initialValues?.center_lat);
  const [centerLon, setCenterLon] = useState(initialValues?.center_lon);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>(initialValues?.event_ids || []);

  const [error, setError] = useState('');

  // Синхронизируем selectedEventIds с initialValues при их изменении
  useEffect(() => {
    if (initialValues?.event_ids) {
      setSelectedEventIds(initialValues.event_ids);
    }
  }, [initialValues?.event_ids]);

  // Передаем текущую конфигурацию наружу для предпросмотра
  useEffect(() => {
    if (onConfigChange) {
      const config: WidgetConfigCreate = {
        api_key_id: apiKeyId,
        title,
        width,
        height,
        primary_color: primaryColor,
        marker_color: markerColor,
        default_period: defaultPeriod as any,
        show_search: showSearch,
        show_filters: showFilters,
        show_categories: showCategories,
        auto_refresh: autoRefresh,
        zoom_level: zoomLevel,
        center_lat: centerLat,
        center_lon: centerLon,
        event_ids: selectedEventIds,
      };
      onConfigChange(config);
    }
  }, [
    title, width, height, primaryColor, markerColor, defaultPeriod,
    showSearch, showFilters, showCategories, autoRefresh, zoomLevel,
    centerLat, centerLon, apiKeyId, selectedEventIds, onConfigChange
  ]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Название обязательно');
      return;
    }

    if (!apiKeyId) {
      setError('Необходимо выбрать API ключ');
      return;
    }

    const data: WidgetConfigCreate = {
      api_key_id: apiKeyId,
      title: title.trim(),
      width,
      height,
      primary_color: primaryColor,
      marker_color: markerColor,
      default_period: defaultPeriod as any,
      show_search: showSearch,
      show_filters: showFilters,
      show_categories: showCategories,
      auto_refresh: autoRefresh,
      zoom_level: zoomLevel,
      center_lat: centerLat,
      center_lon: centerLon,
      event_ids: selectedEventIds,
    };

    try {
      await onSubmit(data);
    } catch {
      setError('Не удалось сохранить виджет. Попробуйте еще раз.');
    }
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEventIds(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const presets = [
    { name: 'Минимальный', values: { showSearch: false, showFilters: false, showCategories: false } },
    { name: 'Базовый', values: { showSearch: true, showFilters: true, showCategories: false } },
    { name: 'Полный', values: { showSearch: true, showFilters: true, showCategories: true } },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setShowSearch(preset.values.showSearch);
    setShowFilters(preset.values.showFilters);
    setShowCategories(preset.values.showCategories);
  };

  const sortEventsByDate = (a: Event, b: Event) => {
    return new Date(a.event_datetime).getTime() - new Date(b.event_datetime).getTime();
  };

  const sortedEvents = [...events].sort(sortEventsByDate);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Основные настройки */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-900">Основные настройки</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="title" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Название виджета *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              placeholder="Мой виджет событий"
            />
          </div>

          <div>
            <label htmlFor="apiKey" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              API ключ *
            </label>
            {apiKeys.length === 0 ? (
              <div className="p-3 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-800 mb-2">Нет доступных API ключей</p>
                <button
                  type="button"
                  onClick={() => navigate('/app/api-keys/new')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Создать API ключ →
                </button>
              </div>
            ) : (
              <select
                id="apiKey"
                value={apiKeyId}
                onChange={(e) => setApiKeyId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              >
                <option value="">Выберите ключ...</option>
                {apiKeys.map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.name || key.key.slice(0, 12)}...{key.key.slice(-4)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="width" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Ширина
            </label>
            <div className="flex gap-2">
              <input
                id="width"
                type="text"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                placeholder="100%"
              />
              <select
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              >
                <option value="100%">100%</option>
                <option value="800px">800px</option>
                <option value="600px">600px</option>
                <option value="400px">400px</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="height" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Высота
            </label>
            <div className="flex gap-2">
              <input
                id="height"
                type="text"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                placeholder="400px"
              />
              <select
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              >
                <option value="400px">400px</option>
                <option value="600px">600px</option>
                <option value="800px">800px</option>
                <option value="100vh">100vh</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* События */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">События</h3>
          <span className="text-xs sm:text-sm text-gray-500">Выбрано: {selectedEventIds.length} из {events.length}</span>
        </div>

        <p className="text-xs sm:text-sm text-gray-600">
          Выберите события, которые должны отображаться в этом виджете.
        </p>

        {events.length === 0 ? (
          <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-sm text-gray-600">У вас пока нет событий.</p>
            <button
              type="button"
              onClick={() => navigate('/app/events/new')}
              className="text-sm text-blue-600 hover:text-blue-800 mt-2"
            >
              Создать первое событие →
            </button>
          </div>
        ) : (
          <div className="border border-gray-300 rounded-xl max-h-[500px] overflow-y-auto">
            {sortedEvents.map((event) => {
              const isSelected = selectedEventIds.includes(event.id);
              const eventDate = new Date(event.event_datetime);
              const isPast = eventDate < new Date();

              return (
                <div
                  key={event.id}
                  className={`flex items-start p-3 sm:p-4 border-b border-gray-200 last:border-b-0 transition-colors ${
                    isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                  } ${isPast ? 'opacity-60' : ''}`}
                >
                  <input
                    type="checkbox"
                    id={`event-${event.id}`}
                    checked={isSelected}
                    onChange={() => !isPast && toggleEvent(event.id)}
                    disabled={isPast}
                    className="h-5 w-5 sm:h-4 sm:w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-0.5 sm:mt-1 flex-shrink-0 cursor-pointer"
                  />
                  <label
                    htmlFor={`event-${event.id}`}
                    className={`ml-3 sm:ml-3 flex-1 min-w-0 ${isPast ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm sm:text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {event.title}
                      </span>
                      {isPast && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                          Прошедшее
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 mt-1">
                      {eventDate.toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        )}

        {selectedEventIds.length > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedEventIds([])}
              className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-xl hover:bg-gray-50"
            >
              Очистить выбор
            </button>
            <button
              type="button"
              onClick={() => setSelectedEventIds(events.map(e => e.id))}
              className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-xl hover:bg-gray-50"
            >
              Выбрать все
            </button>
          </div>
        )}
      </div>

      {/* Цвета */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-900">Цвета</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="primaryColor" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Основной цвет
            </label>
            <div className="flex gap-2 items-center">
              <input
                id="primaryColor"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 sm:w-12 sm:h-10 rounded-lg border border-gray-300 flex-shrink-0"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                placeholder="#007bff"
              />
            </div>
          </div>

          <div>
            <label htmlFor="markerColor" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Цвет меток
            </label>
            <div className="flex gap-2 items-center">
              <input
                id="markerColor"
                type="color"
                value={markerColor}
                onChange={(e) => setMarkerColor(e.target.value)}
                className="w-10 h-10 sm:w-12 sm:h-10 rounded-lg border border-gray-300 flex-shrink-0"
              />
              <input
                type="text"
                value={markerColor}
                onChange={(e) => setMarkerColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                placeholder="#ff0000"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Функциональность */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Функциональность</h3>
          <div className="flex gap-1 sm:gap-2">
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="defaultPeriod" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Период по умолчанию
            </label>
            <select
              id="defaultPeriod"
              value={defaultPeriod}
              onChange={(e) => setDefaultPeriod(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
            >
              <option value="all">Все события</option>
              <option value="today">Сегодня</option>
              <option value="tomorrow">Завтра</option>
              <option value="week">Эта неделя</option>
            </select>
          </div>

          <div>
            <label htmlFor="zoomLevel" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Масштаб карты: {zoomLevel}
            </label>
            <input
              id="zoomLevel"
              type="range"
              min="1"
              max="23"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showSearch}
              onChange={(e) => setShowSearch(e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-xs sm:text-sm text-gray-900">Показать поиск</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showFilters}
              onChange={(e) => setShowFilters(e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-xs sm:text-sm text-gray-900">Показать фильтры по периоду</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showCategories}
              onChange={(e) => setShowCategories(e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-xs sm:text-sm text-gray-900">Показать фильтр по категориям</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-xs sm:text-sm text-gray-900">Автообновление событий</span>
          </label>
        </div>
      </div>

      {/* Кнопки */}
      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold text-sm sm:text-base order-2 sm:order-1"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 transition-all font-semibold shadow-lg text-sm sm:text-base order-1 sm:order-2"
        >
          {isLoading ? 'Сохранение...' : submitButtonText}
        </button>
      </div>
    </form>
  );
};
