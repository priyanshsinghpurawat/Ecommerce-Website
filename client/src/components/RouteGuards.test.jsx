import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { AdminRoute } from './AdminRoute.jsx';
import { SellerRoute } from './SellerRoute.jsx';

vi.mock('../hooks/useAuth.js', () => ({
  useAuth: vi.fn()
}));

import { useAuth } from '../hooks/useAuth.js';

const Child = () => <div>Protected Content</div>;

const renderWithRouter = (Component, authValue, path = '/dashboard') => {
  useAuth.mockReturnValue(authValue);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Component><Child /></Component>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  it('shows loading spinner when loading', () => {
    const { container } = renderWithRouter(ProtectedRoute, { loading: true, isAuthenticated: false });
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    renderWithRouter(ProtectedRoute, { loading: false, isAuthenticated: true });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});

describe('AdminRoute', () => {
  it('shows loading when loading', () => {
    const { container } = renderWithRouter(AdminRoute, { loading: true, isAuthenticated: false, user: null });
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders children when admin', () => {
    renderWithRouter(AdminRoute, { loading: false, isAuthenticated: true, user: { role: 'admin' } });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});

describe('SellerRoute', () => {
  it('shows loading when loading', () => {
    const { container } = renderWithRouter(SellerRoute, { loading: true, isAuthenticated: false, user: null });
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders children when seller', () => {
    renderWithRouter(SellerRoute, { loading: false, isAuthenticated: true, user: { role: 'seller' } });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children when admin (admin has seller access)', () => {
    renderWithRouter(SellerRoute, { loading: false, isAuthenticated: true, user: { role: 'admin' } });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
