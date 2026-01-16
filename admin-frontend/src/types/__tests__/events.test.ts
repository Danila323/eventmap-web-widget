import { describe, it, expect } from 'vitest';
import type { Event, EventCreate, EventUpdate } from '../events';

describe('Event Types', () => {
  it('должен иметь правильные поля в Event типе', () => {
    const event: Event = {
      id: '123',
      title: 'Test Event',
      description: 'Test Description',
      event_datetime: '2026-12-31T19:00:00',
      longitude: 37.6173,
      latitude: 55.7558,
      category: 'concert',
      venue_name: 'Test Venue',
      venue_address: 'Test Address',
      image_url: 'https://example.com/image.jpg',
      ticket_url: 'https://example.com/ticket',
      is_published: true,
      created_at: '2026-01-01T00:00:00',
      updated_at: '2026-01-01T00:00:00',
    };

    expect(event.id).toBe('123');
    expect(event.title).toBe('Test Event');
    expect(event.longitude).toBe(37.6173);
    expect(event.latitude).toBe(55.7558);
  });

  it('должен иметь правильные поля в EventCreate типе', () => {
    const eventCreate: EventCreate = {
      title: 'New Event',
      event_datetime: '2026-12-31T19:00:00',
      longitude: 37.6173,
      latitude: 55.7558,
    };

    expect(eventCreate.title).toBe('New Event');
    expect(eventCreate.description).toBeUndefined();
  });

  it('должен иметь правильные поля в EventUpdate типе', () => {
    const eventUpdate: EventUpdate = {
      title: 'Updated Event',
    };

    expect(eventUpdate.title).toBe('Updated Event');
    expect(eventUpdate.longitude).toBeUndefined();
  });
});
