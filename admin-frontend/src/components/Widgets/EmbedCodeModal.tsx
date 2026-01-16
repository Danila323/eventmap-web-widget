/**
 * Модальное окно с embed кодом.
 */
import { useState } from 'react';

interface EmbedCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  embedCode: string;
  scriptUrl: string;
  previewUrl?: string;
}

export const EmbedCodeModal = ({ isOpen, onClose, embedCode, scriptUrl, previewUrl }: EmbedCodeModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Код для встраивания</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Инструкция */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-3 sm:p-4">
            <h3 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">📋 Как встроить виджет:</h3>
            <ol className="list-decimal list-inside space-y-1 text-xs sm:text-sm text-blue-800">
              <li>Скопируйте код ниже</li>
              <li>Вставьте его на свой сайт в HTML код</li>
              <li>Виджет автоматически загрузится и отобразится</li>
            </ol>
          </div>

          {/* Embed Code */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                HTML код
              </label>
              <button
                onClick={handleCopy}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {copied ? '✓ Скопировано!' : '📋 Копировать'}
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-xl overflow-x-auto text-xs sm:text-sm">
              <code>{embedCode}</code>
            </pre>
          </div>

          {/* Script URL */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Ссылка на JavaScript файл
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}${scriptUrl}`}
                className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-xl text-xs sm:text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}${scriptUrl}`);
                }}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 text-xs sm:text-sm whitespace-nowrap"
              >
                Копировать
              </button>
            </div>
          </div>

          {/* Preview Link */}
          {previewUrl && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Предпросмотр
              </label>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 text-xs sm:text-sm"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Открыть предпросмотр в новой вкладке
              </a>
            </div>
          )}

          {/* Примечание */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-yellow-800">
              <strong>Примечание:</strong> Виджет использует Shadow DOM для изоляции стилей,
              поэтому он не будет конфликтовать с существующими стилями вашего сайта.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-semibold shadow-lg text-sm sm:text-base"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
