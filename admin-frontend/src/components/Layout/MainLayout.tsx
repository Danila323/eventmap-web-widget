/**
 * Главный Layout с боковой панелью навигации.
 */
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: '📊' },
  { name: 'События', href: '/app/events', icon: '📅' },
  { name: 'Виджеты', href: '/app/widgets', icon: '🗺️' },
  { name: 'API ключи', href: '/app/api-keys', icon: '🔑' },
];

export const MainLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Боковая панель */}
      <div className="fixed inset-y-0 left-0 w-16 sm:w-64 bg-white shadow-2xl border-r border-gray-100 z-50">
        <div className="flex flex-col h-full">
          {/* Логотип */}
          <div className="flex items-center justify-center h-14 sm:h-16 border-b border-gray-100">
            <Link to="/app/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
                EventMap
              </span>
            </Link>
          </div>

          {/* Навигация */}
          <nav className="flex-1 px-2 sm:px-4 py-4 sm:py-6 space-y-1 sm:space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-xl transition-all
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  title={item.name}
                >
                  <span className="mr-0 sm:mr-3 text-base sm:text-lg">{item.icon}</span>
                  <span className="hidden sm:block">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Информация о пользователе */}
          <div className="p-2 sm:p-4 border-t border-gray-100">
            <div className="p-2 sm:p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl sm:rounded-2xl">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                  {(user?.name || user?.email)?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.name || 'Пользователь'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Выйти"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="pl-16 sm:pl-64">
        <Outlet />
      </div>
    </div>
  );
};
