/**
 * Типы и интерфейсы для виджета.
 */

export interface WidgetConfig {
  apiKey: string;
  title?: string;
  yandexMapsApiKey?: string;
  width?: string;
  height?: string;
  primaryColor?: string;
  markerColor?: string;
  defaultPeriod?: 'today' | 'tomorrow' | 'week' | 'all';
  showSearch?: boolean;
  showFilters?: boolean;
  showCategories?: boolean;
  autoRefresh?: boolean;
  zoomLevel?: number;
  centerLat?: number;
  centerLon?: number;
  css?: string;
}

export interface WidgetEvent {
  id: string;
  title: string;
  description?: string;
  event_datetime: string;
  longitude: number;
  latitude: number;
  category?: string;
  venue_name?: string;
  venue_address?: string;
  image_url?: string;
  ticket_url?: string;
}

export interface WidgetDataResponse {
  config: WidgetPublicConfig;
  events: WidgetEvent[];
  total: number;
}

export interface WidgetPublicConfig {
  id: string;
  title: string;
  width: string;
  height: string;
  primary_color: string;
  marker_color: string;
  default_period: 'today' | 'tomorrow' | 'week' | 'all';
  show_search: boolean;
  show_filters: boolean;
  show_categories: boolean;
  auto_refresh: boolean;
  zoom_level: number;
  center_lat?: number;
  center_lon?: number;
  css?: string;
}

export interface WidgetState {
  config: WidgetPublicConfig | null;
  events: WidgetEvent[];
  filters: {
    period: 'today' | 'tomorrow' | 'week' | 'all';
    category?: string;
    search: string;
  };
  isLoading: boolean;
  error: string | null;
}

export type StateListener = (state: WidgetState) => void;

// Yandex Maps API types
declare global {
  interface Window {
    ymaps?: {
      ready: (callback: () => void) => void;
      Map: any;
      Placemark: any;
      GeoObjectCollection: any;
      geolocation: any;
    };
  }
}
