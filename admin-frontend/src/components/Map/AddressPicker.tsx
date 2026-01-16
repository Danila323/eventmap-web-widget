/**
 * Компонент для выбора адреса с интеграцией Yandex Maps.
 */
import { useState, useEffect } from 'react';
import { eventsApi } from '../../services';

interface AddressPickerProps {
  longitude: number;
  latitude: number;
  onLocationChange: (longitude: number, latitude: number, address: string) => void;
}

export const AddressPicker = ({ longitude, latitude, onLocationChange }: AddressPickerProps) => {
  const [address, setAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');

  // Загружаем Yandex Maps API один раз
  useEffect(() => {
    // Проверяем, есть ли уже скрипт на странице
    const existingScript = document.getElementById('yandex-maps-script');
    if (existingScript) return;

    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${import.meta.env.VITE_YANDEX_MAPS_API_KEY || ''}`;
    script.async = true;
    script.id = 'yandex-maps-script';

    document.body.appendChild(script);
  }, []);

  const handleGeocode = async () => {
    if (!address.trim()) return;

    setIsGeocoding(true);
    setGeocodeError('');

    try {
      const result = await eventsApi.geocode(address);
      onLocationChange(result.longitude, result.latitude, result.formatted_address);
      setGeocodeError('');
    } catch {
      setGeocodeError('Не удалось найти адрес. Попробуйте другой вариант.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleManualCoordinates = () => {
    // В MVP используем ручной ввод координат
    const lon = prompt('Введите долготу (longitude):', longitude.toString());
    const lat = prompt('Введите широту (latitude):', latitude.toString());

    if (lon && lat) {
      const longitudeNum = parseFloat(lon);
      const latitudeNum = parseFloat(lat);

      if (
        !isNaN(longitudeNum) &&
        !isNaN(latitudeNum) &&
        longitudeNum >= -180 &&
        longitudeNum <= 180 &&
        latitudeNum >= -90 &&
        latitudeNum <= 90
      ) {
        onLocationChange(longitudeNum, latitudeNum, `${latitudeNum}, ${longitudeNum}`);
      } else {
        alert('Некорректные координаты');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Поиск адреса */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Поиск адреса
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Введите адрес (например: Москва, Красная площадь, 1)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleGeocode();
              }
            }}
          />
          <button
            type="button"
            onClick={handleGeocode}
            disabled={isGeocoding}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isGeocoding ? 'Поиск...' : 'Найти'}
          </button>
        </div>
        {geocodeError && (
          <p className="mt-1 text-sm text-red-600">{geocodeError}</p>
        )}
      </div>

      {/* Текущие координаты */}
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Широта (Latitude)
            </label>
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                if (!isNaN(lat) && lat >= -90 && lat <= 90) {
                  onLocationChange(longitude, lat, `${lat}, ${longitude}`);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="55.7558"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Долгота (Longitude)
            </label>
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => {
                const lon = parseFloat(e.target.value);
                if (!isNaN(lon) && lon >= -180 && lon <= 180) {
                  onLocationChange(lon, latitude, `${latitude}, ${lon}`);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="37.6173"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualCoordinates}
          className="mt-3 text-sm text-blue-600 hover:text-blue-800"
        >
          Или введите координаты вручную →
        </button>
      </div>

      {/* Подсказка */}
      <p className="text-xs text-gray-500">
        💡 Введите адрес и нажмите "Найти" для автоматического определения координат,
        или введите координаты вручную.
      </p>
    </div>
  );
};
