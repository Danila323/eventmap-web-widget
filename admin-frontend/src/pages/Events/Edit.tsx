/**
 * Страница редактирования события.
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventsApi, widgetsApi } from '../../services';
import { EventForm } from '../../components';

export const EventEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Record<string, any> | null>(null);
  const [widgets, setWidgets] = useState<Array<{ id: string; title: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        const [eventData, widgetsData] = await Promise.all([
          eventsApi.get(id),
          widgetsApi.list(),
        ]);
        setEvent(eventData);
        setWidgets(widgetsData);
      } catch {
        setError('Событие не найдено');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleSubmit = async (data) => {
    if (!id) return;

    setIsSaving(true);
    try {
      await eventsApi.update(id, data);
      navigate('/app/events');
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

  if (error || !event) {
    return (
      <div className="p-4 sm:p-8">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          {error || 'Событие не найдено'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Редактировать событие</h1>
        <p className="mt-2 text-gray-600">Измените информацию о событии</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100">
        <EventForm
          initialValues={event}
          onSubmit={handleSubmit}
          submitButtonText="Сохранить изменения"
          isLoading={isSaving}
          widgets={widgets}
        />
      </div>
    </div>
  );
};
