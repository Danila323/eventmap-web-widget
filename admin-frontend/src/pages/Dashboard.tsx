/**
 * Главная страница Dashboard.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsApi } from '../services';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    events: 0,
    widgets: 0,
    apiKeys: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await statsApi.get();
        setStats({
          events: data.events.total,
          widgets: data.widgets,
          apiKeys: data.api_keys,
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const statsArray = [
    {
      name: 'Всего событий',
      value: isLoading ? '...' : stats.events.toString(),
      href: '/app/events',
      icon: '📅',
      gradient: 'from-blue-500 to-cyan-500',
      shadow: 'shadow-blue-500/30',
    },
    {
      name: 'Активных виджетов',
      value: isLoading ? '...' : stats.widgets.toString(),
      href: '/app/widgets',
      icon: '🗺️',
      gradient: 'from-purple-500 to-pink-500',
      shadow: 'shadow-purple-500/30',
    },
    {
      name: 'API ключи',
      value: isLoading ? '...' : stats.apiKeys.toString(),
      href: '/app/api-keys',
      icon: '🔑',
      gradient: 'from-orange-500 to-amber-500',
      shadow: 'shadow-orange-500/30',
    },
  ];

  const quickActions = [
    {
      name: 'Создать событие',
      description: 'Добавить новое событие на карту',
      href: '/app/events/new',
      icon: '➕',
      color: 'blue',
    },
    {
      name: 'Создать виджет',
      description: 'Настроить новый виджет для вашего сайта',
      href: '/app/widgets/new',
      icon: '🎨',
      color: 'purple',
    },
    {
      name: 'Создать API ключ',
      description: 'Получить новый API ключ для виджета',
      href: '/app/api-keys/new',
      icon: '🔑',
      color: 'orange',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Заголовок */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="mt-2 sm:mt-3 text-base sm:text-lg text-gray-600">
          Добро пожаловать! Управляйте событиями и виджетами
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {statsArray.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="group relative bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 rounded-xl sm:rounded-2xl transition-opacity`}></div>
          </Link>
        ))}
      </div>

      {/* Быстрые действия */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Быстрые действия</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className={`group flex items-start p-3 sm:p-5 border-2 border-gray-100 rounded-xl hover:border-${action.color}-300 hover:bg-gradient-to-br hover:from-${action.color}-50 hover:to-purple-50 transition-all hover:-translate-y-1`}
              >
                <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-${action.color}-500 to-purple-600 rounded-xl flex items-center justify-center text-lg sm:text-xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">{action.name}</h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-600">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Getting Started */}
      {!isLoading && stats.events === 0 ? (
        <div className="mt-6 sm:mt-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-8 text-white shadow-xl shadow-blue-500/30">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">🚀</span>
            Начало работы
          </h2>
          <ol className="space-y-2 sm:space-y-3 text-sm sm:text-base text-blue-100">
            <li className="flex items-start gap-2 sm:gap-3">
              <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-white/20 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">1</span>
              <span className="text-sm sm:text-base">Создайте API ключ в разделе "API ключи"</span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3">
              <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-white/20 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">2</span>
              <span className="text-sm sm:text-base">Добавьте несколько событий на карту</span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3">
              <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-white/20 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">3</span>
              <span className="text-sm sm:text-base">Создайте и настройте виджет</span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3">
              <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-white/20 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">4</span>
              <span className="text-sm sm:text-base">Скопируйте embed код и вставьте на свой сайт</span>
            </li>
          </ol>
        </div>
      ) : null}
    </div>
  );
};
