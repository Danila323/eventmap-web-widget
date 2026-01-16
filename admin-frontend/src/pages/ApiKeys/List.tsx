/**
 * Страница управления API ключами.
 */
import { useState, useEffect } from 'react';
import { apiKeysApi } from '../../services';
import type { ApiKey } from '../../types';

interface EditModalProps {
  apiKey: ApiKey;
  onClose: () => void;
  onSave: (data: { name?: string; allowed_domains?: string[] }) => Promise<void>;
}

function EditModal({ apiKey, onClose, onSave }: EditModalProps) {
  const [name, setName] = useState(apiKey.name || '');
  const [domainsInput, setDomainsInput] = useState(
    (apiKey.allowed_domains || []).join(', ')
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const allowed_domains = domainsInput
        .split(',')
        .map(d => d.trim())
        .filter(d => d.length > 0);

      await onSave({ name, allowed_domains });
      onClose();
    } catch (err) {
      console.error('Failed to update API key:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const addDomain = () => {
    setDomainsInput(prev => prev ? `${prev}, ` : '');
  };

  const removeDomain = (index: number) => {
    const domains = domainsInput
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0);

    const newDomains = domains.filter((_, i) => i !== index);
    setDomainsInput(newDomains.join(', '));
  };

  const domains = domainsInput
    .split(',')
    .map(d => d.trim())
    .filter(d => d.length > 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-lg w-full mx-4 border border-gray-100">
        <form onSubmit={handleSubmit}>
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Редактирование API ключа
            </h2>
          </div>

          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {/* Имя */}
            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">
                Имя
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm text-sm sm:text-base"
                placeholder="API Key 1"
              />
            </div>

            {/* Разрешённые домены */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">
                Разрешённые домены
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Оставьте пустым для разрешения всех доменов. Используйте *.example.com для wildcard.
              </p>

              {domains.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-2 mb-2">
                  {domains.map((domain, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-purple-800 rounded-full text-xs sm:text-sm font-semibold"
                    >
                      {domain}
                      <button
                        type="button"
                        onClick={() => removeDomain(index)}
                        className="text-purple-400 hover:text-purple-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={domainsInput}
                  onChange={(e) => setDomainsInput(e.target.value)}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm text-sm sm:text-base"
                  placeholder="example.com, *.example.com"
                />
                <button
                  type="button"
                  onClick={addDomain}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-sm sm:text-base"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 border-t border-gray-100 flex justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-gray-700 hover:text-gray-900 font-semibold text-sm sm:text-base"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-semibold disabled:opacity-50 text-sm sm:text-base"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const ApiKeysList = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);

  const loadKeys = async () => {
    setIsLoading(true);
    setError('');

    try {
      const keys = await apiKeysApi.list();
      setApiKeys(keys);
    } catch {
      setError('Не удалось загрузить API ключи');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreate = async () => {
    setIsCreating(true);
    setError('');

    try {
      await apiKeysApi.create();
      loadKeys();
    } catch {
      setError('Не удалось создать API ключ');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, key: string) => {
    const name = apiKeys.find(k => k.id === id)?.name;
    const displayName = name || `${key.slice(0, 12)}...${key.slice(-4)}`;

    if (!confirm(`Удалить API ключ "${displayName}"?`)) return;

    try {
      await apiKeysApi.delete(id);
      loadKeys();
    } catch {
      setError('Не удалось удалить API ключ');
    }
  };

  const handleUpdate = async (id: string, data: { name?: string; allowed_domains?: string[] }) => {
    try {
      await apiKeysApi.update(id, data);
      loadKeys();
    } catch {
      setError('Не удалось обновить API ключ');
    }
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    // Можно добавить уведомление о копировании
  };

  const formatLastUsed = (dateStr: string | undefined) => {
    if (!dateStr) return 'Никогда';

    const date = new Date(dateStr);

    // Форматируем дату
    const datePart = date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    // Форматируем время (используем локальное время из ISO строки)
    const timePart = date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${datePart}, ${timePart}`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Заголовок */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            API ключи
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
            Всего ключей: {apiKeys.length}
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-semibold shadow-lg disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
        >
          {isCreating ? 'Создание...' : '+ Создать новый ключ'}
        </button>
      </div>

      {/* Информация */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-blue-100">
        <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
          <span className="text-lg sm:text-xl">🔑</span>
          Что такое API ключ?
        </h3>
        <p className="text-xs sm:text-sm text-blue-800">
          API ключ используется для связи между вашими событиями и виджетом.
          Каждый виджет привязан к определенному API ключу. Вы можете настроить
          разрешённые домены для каждого ключа отдельно. Держите ключи в секрете!
        </p>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-r-lg mb-4 sm:mb-6 shadow-sm text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Модальное окно редактирования */}
      {editingKey && (
        <EditModal
          apiKey={editingKey}
          onClose={() => setEditingKey(null)}
          onSave={(data) => handleUpdate(editingKey.id, data)}
        />
      )}

      {/* Список ключей */}
      {isLoading ? (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 text-center border border-gray-100">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">Загрузка...</p>
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 text-center border border-gray-100">
          <div className="text-4xl sm:text-5xl lg:text-6xl mb-4">🔑</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">API ключи не созданы</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Создайте API ключ для подключения виджетов к вашим событиям
          </p>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-semibold shadow-lg disabled:opacity-50 text-sm sm:text-base"
          >
            {isCreating ? 'Создание...' : 'Создать первый ключ'}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                <tr>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Имя / Ключ
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Разрешённые домены
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Использований
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                    Последнее использование
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {apiKeys.map((apiKey) => {
                  return (
                    <tr key={apiKey.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors">
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-gray-900">
                            {apiKey.name || 'Без имени'}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs font-mono bg-gradient-to-r from-blue-50 to-purple-50 px-2 sm:px-3 py-1 rounded-lg text-purple-700 font-semibold">
                              {apiKey.key.slice(0, 12)}...{apiKey.key.slice(-4)}
                            </code>
                            <button
                              onClick={() => copyToClipboard(apiKey.key)}
                              className="text-gray-400 hover:text-purple-600 transition-colors"
                              title="Скопировать ключ"
                            >
                              📋
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                        {apiKey.allowed_domains && apiKey.allowed_domains.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {apiKey.allowed_domains.map((domain, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2 sm:px-3 py-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-full text-xs font-semibold"
                              >
                                {domain}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs sm:text-sm">Все домены</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className="text-xs sm:text-sm font-bold text-gray-900">
                          {apiKey.usage_count.toLocaleString('ru-RU')}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                        {formatLastUsed(apiKey.last_used_at)}
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <button
                          onClick={() => setEditingKey(apiKey)}
                          className="text-purple-600 hover:text-purple-900 mr-2 sm:mr-4 font-semibold"
                        >
                          Изменить
                        </button>
                        <button
                          onClick={() => handleDelete(apiKey.id, apiKey.key)}
                          className="text-red-600 hover:text-red-900 font-semibold"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Предупреждение */}
      {apiKeys.length > 0 && (
        <div className="mt-4 sm:mt-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-r-xl p-3 sm:p-4 shadow-sm">
          <p className="text-xs sm:text-sm text-yellow-800">
            <strong className="font-bold">⚠️ Внимание:</strong> API ключи предоставляют доступ к вашим событиям.
            Не передавайте их третьим лицам. Если ключ был скомпрометирован, удалите его и создайте новый.
          </p>
        </div>
      )}
    </div>
  );
};
