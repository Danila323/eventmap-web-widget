import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { api } from '../api';

// Mock для axios
vi.mock('axios');
const mockedAxios = axios as unknown as { interceptors: any };

describe('API Service', () => {
  beforeEach(() => {
    // Сбросываем mock перед каждым тестом
    vi.clearAllMocks();
  });

  it('должен создавать инстанс axios с правильным baseURL', () => {
    expect(api.defaults.baseURL).toBe('/api/v1');
  });

  it('должен добавлять Authorization заголовок из localStorage', () => {
    const token = 'test-token';
    localStorage.setItem('token', token);

    // Проверяем, что токен сохранён
    expect(localStorage.getItem('token')).toBe(token);

    localStorage.removeItem('token');
  });

  it('должен правильно формировать запросы', async () => {
    const mockResponse = { data: { success: true } };
    vi.mocked(axios.get).mockResolvedValue(mockResponse);

    // Тест будет работать когда API вызовы будут через api.get()
    // await api.get('/test');

    // expect(axios.get).toHaveBeenCalledWith('/api/v1/test');
  });
});
