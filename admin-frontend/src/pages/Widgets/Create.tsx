/**
 * Страница создания виджета.
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { widgetsApi, apiKeysApi, eventsApi } from '../../services';
import { WidgetForm, WidgetPreview } from '../../components';
import type { WidgetConfigCreate } from '../../types';

export const WidgetCreate = () => {
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; key: string; name?: string }>>([]);
  const [events, setEvents] = useState<Array<{ id: string; title: string; event_datetime: string }>>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<WidgetConfigCreate>({
    api_key_id: '',
    title: '',
    width: '100%',
    height: '400px',
    primary_color: '#007bff',
    marker_color: '#ff0000',
    default_period: 'all',
    show_search: true,
    show_filters: true,
    show_categories: true,
    auto_refresh: false,
    zoom_level: 10,
    event_ids: [],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [keys, eventsData] = await Promise.all([
          apiKeysApi.list(),
          eventsApi.list({ page: 1, page_size: 100 }),
        ]);
        setApiKeys(keys);
        setEvents(eventsData.items);
      } catch {
        // Ошибка при загрузке данных
      } finally {
        setIsLoadingKeys(false);
        setIsLoadingEvents(false);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (data: WidgetConfigCreate) => {
    setIsSubmitting(true);
    try {
      await widgetsApi.create(data);
      navigate('/app/widgets');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingKeys || isLoadingEvents) {
    return (
      <div className="p-4 sm:p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (apiKeys.length === 0) {
    return (
      <div className="p-4 sm:p-8">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-r-xl p-6 max-w-lg shadow-sm">
          <h2 className="text-lg font-bold text-yellow-900 mb-2 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            Необходим API ключ
          </h2>
          <p className="text-yellow-800 mb-4">
            Для создания виджета сначала нужно создать API ключ.
          </p>
          <Link
            to="/app/api-keys"
            className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold shadow-lg"
          >
            Создать API ключ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Создать виджет</h1>
        <p className="mt-2 text-gray-600">Настройте внешний вид и функциональность виджета</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Форма настроек */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 w-full">
          <WidgetForm
            onSubmit={handleSubmit}
            submitButtonText="Создать виджет"
            isLoading={isSubmitting}
            apiKeys={apiKeys}
            events={events}
            onConfigChange={setCurrentConfig}
          />
        </div>

        {/* Предпросмотр */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 w-full xl:sticky xl:top-8 xl:self-start">
          <WidgetPreview config={currentConfig} eventIds={currentConfig.event_ids} />
        </div>
      </div>
    </div>
  );
};
