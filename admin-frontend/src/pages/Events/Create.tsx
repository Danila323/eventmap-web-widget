/**
 * Страница создания нового события.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi, widgetsApi } from '../../services';
import { EventForm } from '../../components';

export const EventCreate = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [widgets, setWidgets] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    const loadWidgets = async () => {
      try {
        const data = await widgetsApi.list();
        setWidgets(data);
      } catch (error) {
        console.error('Failed to load widgets:', error);
      }
    };
    loadWidgets();
  }, []);

  const handleSubmit = async (data) => {
    setIsLoading(true);
    try {
      await eventsApi.create(data);
      navigate('/app/events');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Создать событие</h1>
        <p className="mt-2 text-gray-600">Заполните информацию о новом событии</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100">
        <EventForm
          onSubmit={handleSubmit}
          submitButtonText="Создать событие"
          isLoading={isLoading}
          widgets={widgets}
        />
      </div>
    </div>
  );
};
