/**
 * Типы для событий.
 */

export interface Event {
  id: string;
  user_id: string;
  widget_ids: string[];
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
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventCreate {
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
  is_published: boolean;
  widget_ids?: string[];
}

export interface EventUpdate {
  title?: string;
  description?: string;
  event_datetime?: string;
  longitude?: number;
  latitude?: number;
  category?: string;
  venue_name?: string;
  venue_address?: string;
  image_url?: string;
  ticket_url?: string;
  is_published?: boolean;
  widget_ids?: string[];
}

export interface EventListResponse {
  items: Event[];
  total: number;
  page: number;
  page_size: number;
}

export interface GeocodeResponse {
  longitude: number;
  latitude: number;
  formatted_address: string;
}

export interface EventFilters {
  page?: number;
  page_size?: number;
  category?: string;
  search?: string;
  period?: 'today' | 'tomorrow' | 'week' | 'month' | 'all';
  date_from?: string;
  date_to?: string;
  only_published?: boolean;
  widget_id?: string;
}
