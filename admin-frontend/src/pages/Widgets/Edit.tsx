/**
 * Страница редактирования виджета.
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { widgetsApi, apiKeysApi, eventsApi } from '../../services';
import { WidgetForm, WidgetPreview, EmbedCodeModal } from '../../components';
import type { WidgetConfigCreate, ApiKey } from '../../types';

export const WidgetEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [widget, setWidget] = useState<Record<string, any> | null>(null);
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; key: string; name?: string }>>([]);
  const [events, setEvents] = useState<Array<{ id: string; title: string; event_datetime: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
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

  // Embed modal state
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [embedCode, setEmbedCode] = useState<{ embed_code: string; script_url: string; preview_url?: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        const [widgetData, keysData, eventsData] = await Promise.all([
          widgetsApi.get(id),
          apiKeysApi.list(),
          eventsApi.list({ page: 1, page_size: 100 }),
        ]);
        setWidget(widgetData);
        setApiKeys(keysData);
        setEvents(eventsData.items);
        // Устанавливаем начальную конфигурацию для предпросмотра
        setCurrentConfig({
          api_key_id: widgetData.api_key_id || '',
          title: widgetData.title || '',
          width: widgetData.width || '100%',
          height: widgetData.height || '400px',
          primary_color: widgetData.primary_color || '#007bff',
          marker_color: widgetData.marker_color || '#ff0000',
          default_period: widgetData.default_period || 'all',
          show_search: widgetData.show_search ?? true,
          show_filters: widgetData.show_filters ?? true,
          show_categories: widgetData.show_categories ?? true,
          auto_refresh: widgetData.auto_refresh ?? false,
          zoom_level: widgetData.zoom_level || 10,
          center_lat: widgetData.center_lat,
          center_lon: widgetData.center_lon,
          event_ids: widgetData.event_ids || [],
        });
      } catch {
        setError('Виджет не найден');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleGetEmbedCode = async () => {
    if (!id) return;

    try {
      const code = await widgetsApi.generateEmbed(id);
      setEmbedCode(code);
      setShowEmbedModal(true);
    } catch {
      setError('Не удалось сгенерировать embed код');
    }
  };

  const handleSubmit = async (data: WidgetConfigCreate) => {
    if (!id) return;

    setIsSaving(true);
    try {
      await widgetsApi.update(id, data);
      navigate('/app/widgets');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error || !widget) {
    return (
      <div className="p-4 sm:p-8">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          {error || 'Виджет не найден'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Редактировать виджет</h1>
          <p className="mt-2 text-gray-600">Измените настройки виджета</p>
        </div>
        <button
          onClick={handleGetEmbedCode}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all font-semibold shadow-lg text-sm sm:text-base whitespace-nowrap"
        >
          📋 Получить embed код
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Форма настроек */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 w-full">
          <WidgetForm
            initialValues={widget}
            onSubmit={handleSubmit}
            submitButtonText="Сохранить изменения"
            isLoading={isSaving}
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

      {/* Embed Code Modal */}
      {embedCode && (
        <EmbedCodeModal
          isOpen={showEmbedModal}
          onClose={() => setShowEmbedModal(false)}
          embedCode={embedCode.embed_code}
          scriptUrl={embedCode.script_url}
          previewUrl={embedCode.preview_url}
        />
      )}
    </div>
  );
};
