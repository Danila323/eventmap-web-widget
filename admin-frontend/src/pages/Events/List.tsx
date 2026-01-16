/**
 * Страница списка событий.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi, widgetsApi } from '../../services';
import type { Event, EventFilters } from '../../types';

export const EventsList = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [widgets, setWidgets] = useState<Array<{ id: string; title: string }>>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [filters, setFilters] = useState<EventFilters>({
    page,
    page_size: pageSize,
  });

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [eventsResponse, widgetsResponse] = await Promise.all([
        eventsApi.list({ ...filters, page, page_size: pageSize }),
        widgetsApi.list(),
      ]);
      setEvents(eventsResponse.items);
      setTotal(eventsResponse.total);
      setWidgets(widgetsResponse);
    } catch {
      setError('Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, filters]);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить событие?')) return;

    try {
      await eventsApi.delete(id);
      loadData();
    } catch {
      setError('Не удалось удалить событие');
    }
  };

  // Custom input styles
  const inputStyle = "w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm hover:border-purple-300 text-sm sm:text-base";
  const selectStyle = "w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm hover:border-purple-300 text-sm sm:text-base";
  const labelStyle = "block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Заголовок */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            События
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
            Всего событий: {total}
          </p>
        </div>
        <Link
          to="/app/events/new"
          className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-semibold shadow-lg text-sm sm:text-base whitespace-nowrap"
        >
          + Создать событие
        </Link>
      </div>

      {/* Фильтры */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-blue-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div>
            <label className={labelStyle}>Поиск</label>
            <input
              type="text"
              placeholder="Название или описание..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
              className={inputStyle}
            />
          </div>

          <div>
            <label className={labelStyle}>Категория</label>
            <select
              value={filters.category || ''}
              onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
              className={selectStyle}
            >
              <option value="">Все категории</option>
              <option value="Концерты">Концерты</option>
              <option value="Выставки">Выставки</option>
              <option value="Спорт">Спорт</option>
              <option value="Конференции">Конференции</option>
            </select>
          </div>

          <div>
            <label className={labelStyle}>Период</label>
            <select
              value={filters.period || 'all'}
              onChange={(e) => setFilters({ ...filters, period: e.target.value as any || undefined })}
              className={selectStyle}
            >
              <option value="all">Все</option>
              <option value="today">Сегодня</option>
              <option value="tomorrow">Завтра</option>
              <option value="week">Эта неделя</option>
              <option value="month">Этот месяц</option>
            </select>
          </div>

          <div>
            <label className={labelStyle}>Виджет</label>
            <select
              value={filters.widget_id || ''}
              onChange={(e) => setFilters({ ...filters, widget_id: e.target.value || undefined })}
              className={selectStyle}
            >
              <option value="">Все виджеты</option>
              {widgets.map((widget) => (
                <option key={widget.id} value={widget.id}>
                  {widget.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ page: 1, page_size: pageSize })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
            >
              Сбросить
            </button>
          </div>
        </div>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-r-lg mb-4 sm:mb-6 shadow-sm text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Таблица событий */}
      {isLoading ? (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 text-center border border-gray-100">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">Загрузка...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 text-center border border-gray-100">
          <p className="text-gray-600 text-sm sm:text-base">События не найдены</p>
          <Link
            to="/app/events/new"
            className="mt-4 inline-block text-purple-600 hover:text-purple-800 font-semibold text-sm sm:text-base"
          >
            Создать первое событие →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                <tr>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Событие
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Дата и время
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Категория
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors">
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                      <div>
                        <Link
                          to={`/app/events/${event.id}/edit`}
                          className="text-xs sm:text-sm font-bold text-purple-600 hover:text-purple-800"
                        >
                          {event.title}
                        </Link>
                        {event.venue_name && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">{event.venue_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-semibold text-gray-900">
                        {new Date(event.event_datetime).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        {new Date(event.event_datetime).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className="px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-purple-800">
                        {event.category || 'Без категории'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                        event.is_published
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800'
                          : 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800'
                      }`}>
                        {event.is_published ? '✓ Опубликовано' : '○ Черновик'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                      <Link
                        to={`/app/events/${event.id}/edit`}
                        className="text-purple-600 hover:text-purple-900 mr-2 sm:mr-4 font-semibold"
                      >
                        Редактировать
                      </Link>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-red-600 hover:text-red-900 font-semibold"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Пагинация */}
          {total > pageSize && (
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
              <div className="text-xs sm:text-sm font-semibold text-gray-700">
                Показано {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} из {total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all font-semibold text-xs sm:text-sm"
                >
                  ← Назад
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * pageSize >= total}
                  className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all font-semibold text-xs sm:text-sm"
                >
                  Вперед →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
