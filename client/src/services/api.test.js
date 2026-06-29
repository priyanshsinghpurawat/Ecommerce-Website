import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the whole axios module (hoisted automatically by Vitest)
vi.mock('axios', () => {
  globalThis.__mocks__ = {
    responseSuccessHandler: null,
    responseErrorHandler: null
  };

  const instance = {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: {
        use: vi.fn((successFn, errorFn) => {
          globalThis.__mocks__.responseSuccessHandler = successFn;
          globalThis.__mocks__.responseErrorHandler = errorFn;
        }),
        eject: vi.fn()
      }
    }
  };
  return {
    default: {
      create: vi.fn(() => instance)
    }
  };
});

// Import the services AFTER the mock is registered
import api from './api.js';
import { login, register, me, logout } from './auth.service.js';
import { getProducts, createProduct } from './product.service.js';
import { getPaymentConfig } from './payment.service.js';

describe('Frontend API Clients and Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    const store = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, val) => { store[key] = String(val); }),
      removeItem: vi.fn((key) => { delete store[key]; }),
      clear: vi.fn(() => { for (const k in store) delete store[k]; })
    });

    // Mock window and Event globally to run inside Node environment
    const mockWindow = {
      dispatchEvent: vi.fn()
    };
    vi.stubGlobal('window', mockWindow);
    
    // Make Event constructible so `new Event()` does not throw
    const MockEvent = function (name) {
      this.name = name;
    };
    vi.stubGlobal('Event', MockEvent);
  });

  describe('Auth Services', () => {
    it('login() should send a POST request to /auth/login with correct payload', async () => {
      api.post.mockResolvedValue({ data: { user: 'Test User' } });

      const data = await login('test@example.com', 'pass123');
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'pass123'
      });
      expect(data).toEqual({ user: 'Test User' });
    });

    it('register() should send a POST request to /auth/register with user info', async () => {
      api.post.mockResolvedValue({ data: { success: true } });

      const data = await register('Test User', 'test@example.com', 'pass123');
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123'
      });
      expect(data.success).toBe(true);
    });

    it('me() should query GET /auth/me to fetch session profile', async () => {
      api.get.mockResolvedValue({ data: { email: 'test@example.com' } });

      const data = await me();
      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(data.email).toBe('test@example.com');
    });

    it('logout() should call POST /auth/logout', async () => {
      api.post.mockResolvedValue({ data: { success: true } });

      await logout();
      expect(api.post).toHaveBeenCalledWith('/auth/logout');
    });
  });

  describe('Catalog Services', () => {
    it('getProducts() should make a GET query with page, search, and limit params', async () => {
      api.get.mockResolvedValue({ data: [] });

      await getProducts({ page: 2, limit: 12, search: 'sneakers' });
      expect(api.get).toHaveBeenCalledWith('/products', {
        params: { page: 2, limit: 12, search: 'sneakers' }
      });
    });

    it('createProduct() should set Content-Type header to multipart/form-data for FormData payloads', async () => {
      api.post.mockResolvedValue({ data: { success: true } });
      
      const formData = new FormData();
      formData.append('title', 'Tee');

      await createProduct(formData);
      expect(api.post).toHaveBeenCalledWith('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    });
  });

  describe('Payment Config Services', () => {
    it('getPaymentConfig() should call GET /payments/config', async () => {
      api.get.mockResolvedValue({ data: { razorpayEnabled: true } });

      const data = await getPaymentConfig();
      expect(api.get).toHaveBeenCalledWith('/payments/config');
      expect(data.razorpayEnabled).toBe(true);
    });
  });

  describe('Axios Response Interceptors', () => {
    it('should intercept 401 errors, remove user from localStorage, and trigger unauthorized event', async () => {
      const errorHandler = globalThis.__mocks__.responseErrorHandler;
      expect(errorHandler).toBeTypeOf('function');
      
      // Set user in mocked localStorage
      localStorage.setItem('user', JSON.stringify({ name: 'User' }));
      
      const errorPayload = {
        response: { status: 401 },
        config: { url: '/api/v3/products' }
      };

      await expect(errorHandler(errorPayload)).rejects.toEqual(errorPayload);

      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
      expect(window.dispatchEvent).toHaveBeenCalled();
    });

    it('should NOT clear localStorage on 401 when the request is login', async () => {
      const errorHandler = globalThis.__mocks__.responseErrorHandler;
      expect(errorHandler).toBeTypeOf('function');

      localStorage.setItem('user', JSON.stringify({ name: 'User' }));

      const errorPayload = {
        response: { status: 401 },
        config: { url: '/auth/login' }
      };

      await expect(errorHandler(errorPayload)).rejects.toEqual(errorPayload);

      expect(localStorage.removeItem).not.toHaveBeenCalled();
      expect(window.dispatchEvent).not.toHaveBeenCalled();
    });
  });
});
