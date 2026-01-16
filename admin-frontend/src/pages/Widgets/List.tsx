/**
 * Страница списка виджетов.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { widgetsApi, apiKeysApi } from '../../services';
import { EmbedCodeModal } from '../../components';
import type { WidgetConfig, ApiKey, EmbedCode } from '../../types';

export const WidgetsList = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [selectedWidget, setSelectedWidget] = useState<WidgetConfig | null>(null);
  const [embedCode, setEmbedCode] = useState<EmbedCode | null>(null);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [widgetsData, keysData] = await Promise.all([
        widgetsApi.list(),
        apiKeysApi.list(),
      ]);
      setWidgets(widgetsData);
      setApiKeys(keysData);
    } catch {
      setError('Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить виджет?')) return;

    try {
      await widgetsApi.delete(id);
      loadData();
    } catch {
      setError('Не удалось удалить виджет');
    }
  };

  const handleGetEmbedCode = async (widget: WidgetConfig) => {
    try {
      const code = await widgetsApi.generateEmbed(widget.id);
      setEmbedCode(code);
      setSelectedWidget(widget);
      setShowEmbedModal(true);
    } catch {
      setError('Не удалось сгенерировать embed код');
    }
  };

  const getApiKeyDisplay = (keyId: string) => {
    const key = apiKeys.find((k) => k.id === keyId);
    if (!key) return 'Неизвестный ключ';
    return `${key.key.slice(0, 12)}...${key.key.slice(-4)}`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Заголовок */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Виджеты
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
            Всего виджетов: {widgets.length}
          </p>
        </div>
        <Link
          to={apiKeys.length === 0 ? '/app/api-keys' : '/app/widgets/new'}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-semibold shadow-lg text-sm sm:text-base whitespace-nowrap"
        >
          {apiKeys.length === 0 ? '+ Создать API ключ' : '+ Создать виджет'}
        </Link>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-r-lg mb-4 sm:mb-6 shadow-sm text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Список виджетов */}
      {isLoading ? (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 text-center border border-gray-100">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">Загрузка...</p>
        </div>
      ) : widgets.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 text-center border border-gray-100">
          <div className="text-4xl sm:text-5xl lg:text-6xl mb-4">🗺️</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Виджеты не созданы</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            {apiKeys.length === 0
              ? 'Сначала создайте API ключ, затем сможете создать виджет'
              : 'Создайте свой первый виджет для отображения событий на карте'}
          </p>
          <Link
            to={apiKeys.length === 0 ? '/app/api-keys' : '/app/widgets/new'}
            className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-semibold text-sm sm:text-base"
          >
            {apiKeys.length === 0 ? 'Создать API ключ' : 'Создать виджет'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {widgets.map((widget) => (
            <div key={widget.id} className="group bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">{widget.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      API ключ: {getApiKeyDisplay(widget.api_key_id)}
                    </p>
                  </div>
                  <div
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 shadow-sm flex-shrink-0"
                    style={{ borderColor: widget.primary_color }}
                  ></div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Размер:</span>
                  <span className="font-semibold text-gray-900">{widget.width} × {widget.height}</span>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Период:</span>
                  <span className="font-semibold text-gray-900">
                    {widget.default_period === 'all' && 'Все'}
                    {widget.default_period === 'today' && 'Сегодня'}
                    {widget.default_period === 'tomorrow' && 'Завтра'}
                    {widget.default_period === 'week' && 'Неделя'}
                  </span>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-wrap">
                  {widget.show_search && (
                    <span className="px-2 sm:px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-purple-800 rounded-full text-xs font-semibold">🔍 Поиск</span>
                  )}
                  {widget.show_filters && (
                    <span className="px-2 sm:px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-purple-800 rounded-full text-xs font-semibold">⏱️ Фильтры</span>
                  )}
                  {widget.show_categories && (
                    <span className="px-2 sm:px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-purple-800 rounded-full text-xs font-semibold">🏷️ Категории</span>
                  )}
                </div>

                {/* Цвета */}
                <div className="flex items-center gap-2 pt-2 sm:pt-3 border-t border-gray-100">
                  <div
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl shadow-sm"
                    style={{ backgroundColor: widget.primary_color }}
                    title="Основной цвет"
                  ></div>
                  <div
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl shadow-sm"
                    style={{ backgroundColor: widget.marker_color }}
                    title="Цвет меток"
                  ></div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => handleGetEmbedCode(widget)}
                  className="flex-1 px-2 sm:px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs sm:text-sm rounded-xl hover:shadow-lg transition-all font-semibold"
                >
                  📋 Embed код
                </button>
                <Link
                  to={`/app/widgets/${widget.id}/edit`}
                  className="flex-1 px-2 sm:px-3 py-2 border-2 border-gray-200 text-gray-700 text-xs sm:text-sm text-center rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all font-semibold"
                >
                  ✏️ Редактировать
                </Link>
                <button
                  onClick={() => handleDelete(widget.id)}
                  className="px-2 sm:px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm sm:text-base"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Embed Code Modal */}
      <EmbedCodeModal
        isOpen={showEmbedModal}
        onClose={() => setShowEmbedModal(false)}
        embedCode={embedCode?.embed_code || ''}
        scriptUrl={embedCode?.script_url || ''}
        previewUrl={embedCode?.preview_url}
      />
    </div>
  );
};
