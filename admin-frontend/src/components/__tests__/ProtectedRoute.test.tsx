import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../../test/utils';
import ProtectedRoute from '../ProtectedRoute';

// Mock для AuthContext
const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

describe('ProtectedRoute', () => {
  it('должен перенаправлять на login если пользователь не авторизован', async () => {
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(window.location.pathname).toBe('/login');
    });
  });

  it('должен отображать контент если пользователь авторизован', async () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = {
      id: '123',
      email: 'test@example.com',
      full_name: 'Test User',
    };

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});
