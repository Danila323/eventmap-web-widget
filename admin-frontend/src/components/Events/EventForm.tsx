/**
 * Форма создания/редактирования события.
 */
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AddressPicker } from '../Map';
import type { EventCreate, EventUpdate } from '../../types';

interface Widget {
  id: string;
  title: string;
}

interface EventFormProps {
  initialValues?: EventUpdate;
  onSubmit: (data: EventCreate | EventUpdate) => Promise<void>;
  submitButtonText: string;
  isLoading?: boolean;
  widgets?: Widget[];
}

export const EventForm = ({ initialValues, onSubmit, submitButtonText, isLoading = false, widgets = [] }: EventFormProps) => {
  const navigate = useNavigate();

  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [eventDatetime, setEventDatetime] = useState(
    initialValues?.event_datetime || new Date().toISOString().slice(0, 16)
  );
  const [longitude, setLongitude] = useState(initialValues?.longitude || 37.6173);
  const [latitude, setLatitude] = useState(initialValues?.latitude || 55.7558);
  const [category, setCategory] = useState(initialValues?.category || '');
  const [venueName, setVenueName] = useState(initialValues?.venue_name || '');
  const [venueAddress, setVenueAddress] = useState(initialValues?.venue_address || '');
  const [imageUrl, setImageUrl] = useState(initialValues?.image_url || '');
  const [ticketUrl, setTicketUrl] = useState(initialValues?.ticket_url || '');
  const [selectedWidgetIds, setSelectedWidgetIds] = useState<string[]>(initialValues?.widget_ids || []);

  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Название обязательно');
      return;
    }

    const data: EventCreate | EventUpdate = {
      title: title.trim(),
      description: description.trim() || undefined,
      event_datetime: new Date(eventDatetime).toISOString(),
      longitude,
      latitude,
      category: category.trim() || undefined,
      venue_name: venueName.trim() || undefined,
      venue_address: venueAddress.trim() || undefined,
      image_url: imageUrl.trim() || undefined,
      ticket_url: ticketUrl.trim() || undefined,
      is_published: selectedWidgetIds.length > 0,
      widget_ids: selectedWidgetIds,
    };

    try {
      await onSubmit(data);
    } catch {
      setError('Не удалось сохранить событие. Попробуйте еще раз.');
    }
  };

  const handleLocationChange = (lon: number, lat: number, address: string) => {
    setLongitude(lon);
    setLatitude(lat);
    if (address && !venueAddress) {
      setVenueAddress(address);
    }
  };

  const toggleWidget = (widgetId: string) => {
    setSelectedWidgetIds(prev =>
      prev.includes(widgetId)
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  // Custom input styles
  const inputStyle = "w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm hover:border-purple-300 text-sm sm:text-base";
  const labelStyle = "block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2";
  const sectionTitleStyle = "text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          {error}
        </div>
      )}

      {/* Основная информация */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 shadow-lg border border-blue-100">
        <h3 className={sectionTitleStyle}>
          <span className="text-xl sm:text-2xl">📝</span>
          Основная информация
        </h3>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="title" className={labelStyle}>
              Название события *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputStyle}
              placeholder="Концерт, выставка, конференция..."
            />
          </div>

          <div>
            <label htmlFor="description" className={labelStyle}>
              Описание
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputStyle}
              placeholder="Подробное описание события..."
            />
          </div>

          <div>
            <label htmlFor="datetime" className={labelStyle}>
              Дата и время *
            </label>
            <input
              id="datetime"
              type="datetime-local"
              value={eventDatetime}
              onChange={(e) => setEventDatetime(e.target.value)}
              required
              className={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="category" className={labelStyle}>
              Категория
            </label>
            <input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputStyle}
              placeholder="Концерты, выставки, спорт..."
              list="categories"
            />
            <datalist id="categories">
              <option value="Концерты" />
              <option value="Выставки" />
              <option value="Спорт" />
              <option value="Конференции" />
              <option value="Театр" />
              <option value="Кино" />
              <option value="Фестивали" />
              <option value="Образование" />
            </datalist>
          </div>
        </div>
      </div>

      {/* Местоположение */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 sm:p-6 shadow-lg border border-green-100">
        <h3 className={sectionTitleStyle}>
          <span className="text-xl sm:text-2xl">📍</span>
          Местоположение
        </h3>

        <div className="space-y-3 sm:space-y-4">
          <AddressPicker
            longitude={longitude}
            latitude={latitude}
            onLocationChange={handleLocationChange}
          />

          <div>
            <label htmlFor="venueName" className={labelStyle}>
              Название места
            </label>
            <input
              id="venueName"
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              className={inputStyle}
              placeholder="Стадион, театр, клуб..."
            />
          </div>

          <div>
            <label htmlFor="venueAddress" className={labelStyle}>
              Адрес места
            </label>
            <input
              id="venueAddress"
              type="text"
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              className={inputStyle}
              placeholder="Полный адрес..."
            />
          </div>
        </div>
      </div>

      {/* Виджеты */}
      {widgets.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 sm:p-6 shadow-lg border border-purple-100">
          <h3 className={sectionTitleStyle}>
            <span className="text-xl sm:text-2xl">🗺️</span>
            Отображение в виджетах
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Выберите виджеты, в которых должно отображаться это событие</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {widgets.map((widget) => (
              <label
                key={widget.id}
                className={`flex items-center p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedWidgetIds.includes(widget.id)
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedWidgetIds.includes(widget.id)}
                  onChange={() => toggleWidget(widget.id)}
                  className="sr-only"
                />
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedWidgetIds.includes(widget.id)
                      ? 'bg-white border-white'
                      : 'bg-white border-gray-300'
                  }`}>
                    {selectedWidgetIds.includes(widget.id) && (
                      <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="font-medium text-xs sm:text-sm truncate">{widget.title}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Дополнительные ссылки */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 sm:p-6 shadow-lg border border-orange-100">
        <h3 className={sectionTitleStyle}>
          <span className="text-xl sm:text-2xl">🔗</span>
          Дополнительные ссылки
        </h3>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="imageUrl" className={labelStyle}>
              Ссылка на изображение
            </label>
            <input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className={inputStyle}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label htmlFor="ticketUrl" className={labelStyle}>
              Ссылка на билеты
            </label>
            <input
              id="ticketUrl"
              type="url"
              value={ticketUrl}
              onChange={(e) => setTicketUrl(e.target.value)}
              className={inputStyle}
              placeholder="https://example.com/tickets"
            />
          </div>
        </div>
      </div>

      {/* Кнопки */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
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
