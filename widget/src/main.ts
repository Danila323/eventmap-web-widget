/**
 * Event Map Widget - Entry Point
 *
 * This widget is designed to be embedded on any website.
 * It uses unique CSS selectors to isolate styles and prevent conflicts.
 */

import { Widget } from './core/Widget'
import type { WidgetConfig } from './types'

// Widget bootstrap function
async function initWidget(containerId: string, apiKey: string, serverConfig?: any) {
  const container = document.getElementById(containerId)
  if (!container) {
    console.error(`EventMapWidget: Container #${containerId} not found`)
    return
  }

  // Загружаем конфигурацию с сервера, если она не передана
  let finalConfig: WidgetConfig = { apiKey }

  if (!serverConfig) {
    try {
      const scriptBaseUrl = getScriptBaseUrl()
      const response = await fetch(`${scriptBaseUrl}/widget/${apiKey}/config`)
      if (response.ok) {
        serverConfig = await response.json()
      }
    } catch (error) {
      console.error('Failed to fetch widget config:', error)
    }
  }

  // Если API ключ Яндекс Карт не передан, получаем его с backend
  if (serverConfig && !finalConfig.yandexMapsApiKey) {
    try {
      const scriptBaseUrl = getScriptBaseUrl()
      const response = await fetch(`${scriptBaseUrl}/config/yandex-maps-key`)
      if (response.ok) {
        const data = await response.json()
        finalConfig = { ...finalConfig, yandexMapsApiKey: data.api_key }
      }
    } catch (error) {
      console.error('Failed to fetch Yandex Maps API key:', error)
    }
  }

  // Применяем настройки с сервера
  if (serverConfig) {
    finalConfig = {
      ...finalConfig,
      title: serverConfig.title || 'Мероприятия',
      width: serverConfig.width || '100%',
      height: serverConfig.height || '400px',
      primaryColor: serverConfig.primary_color || '#007bff',
      markerColor: serverConfig.marker_color || '#ff0000',
      defaultPeriod: serverConfig.default_period || 'all',
      showSearch: serverConfig.show_search ?? true,
      showFilters: serverConfig.show_filters ?? true,
      showCategories: serverConfig.show_categories ?? true,
      autoRefresh: serverConfig.auto_refresh ?? false,
      zoomLevel: serverConfig.zoom_level || 10,
      centerLat: serverConfig.center_lat,
      centerLon: serverConfig.center_lon,
      css: serverConfig.css,
    }
  }

  const widget = new Widget(container, finalConfig)
  await widget.mount()

  return widget
}

// Получить базовый URL API из источника скрипта
function getScriptBaseUrl(): string {
  const scripts = document.querySelectorAll('script[src*="widget.js"]')
  if (scripts.length > 0) {
    const script = scripts[scripts.length - 1] as HTMLScriptElement
    const src = script.src
    // Убираем /widget.js и получаем базовый URL
    return src.replace(/\/widget\.js$/, '').replace(/\/api\/v1$/, '/api/v1')
  }
  // Fallback на тот же домен
  return '/api/v1'
}

// Auto-initialize from data attributes
const currentScript = document.currentScript as HTMLScriptElement
if (currentScript && currentScript.dataset.widgetKey) {
  const containerId = currentScript.dataset.container || `eventmap-widget-${Math.random().toString(36).slice(2, 10)}`
  const apiKey = currentScript.dataset.widgetKey

  // Создаём контейнер если его нет
  if (!document.getElementById(containerId)) {
    const container = document.createElement('div')
    container.id = containerId
    currentScript.parentNode?.insertBefore(container, currentScript.nextSibling)
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initWidget(containerId, apiKey)
    })
  } else {
    initWidget(containerId, apiKey)
  }
}

// Export for manual initialization
export { initWidget, Widget }
