/**
 * Типы для виджетов.
 */

export interface WidgetConfig {
  id: string;
  user_id: string;
  api_key_id: string;
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
  event_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface WidgetConfigCreate {
  api_key_id: string;
  title: string;
  width?: string;
  height?: string;
  primary_color?: string;
  marker_color?: string;
  default_period?: 'today' | 'tomorrow' | 'week' | 'all';
  show_search?: boolean;
  show_filters?: boolean;
  show_categories?: boolean;
  auto_refresh?: boolean;
  zoom_level?: number;
  center_lat?: number;
  center_lon?: number;
  event_ids?: string[];
}

export interface ApiKey {
  id: string;
  user_id: string;
  key: string;
  name?: string;
  allowed_domains?: string[];
  usage_count: number;
  created_at: string;
  last_used_at?: string;
}

export interface EmbedCode {
  script_url: string;
  embed_code: string;
  preview_url?: string;
}
