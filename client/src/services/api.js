/**
 * Shared HTTP client. Auth uses httpOnly cookie (withCredentials: true).
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    
    // Only clear localStorage on a definitive 401 that isn't a login attempt.
    // Avoid triggering full page reloads to prevent loop cascades.
    if (status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
      if (localStorage.getItem('user')) {
        localStorage.removeItem('user');
        // Dispatch custom event so React context can sync immediately without reload
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;

/* -------------------------------------------------------------------------- */
/*                                AUTH SERVICE                                */
/* -------------------------------------------------------------------------- */

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const register = async (name, email, password) => {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
};

export const googleLogin = async (idToken) => {
  const { data } = await api.post('/auth/google-login', { idToken });
  return data;
};

export const me = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const logout = async () => {
  const { data } = await api.post('/auth/logout');
  return data;
};

/* -------------------------------------------------------------------------- */
/*                              PRODUCT SERVICE                               */
/* -------------------------------------------------------------------------- */

export const getProducts = async (params = {}) => {
  const { data } = await api.get('/products', { params });
  return data;
};

export const getProductById = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};

export const createProduct = async (productData) => {
  const config = productData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  const { data } = await api.post('/products', productData, config);
  return data;
};

export const updateProduct = async (id, productData) => {
  const config = productData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  const { data } = await api.put(`/products/${id}`, productData, config);
  return data;
};

export const deleteProduct = async (id) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};

/* -------------------------------------------------------------------------- */
/*                                CART SERVICE                                */
/* -------------------------------------------------------------------------- */

export const getCart = async () => {
  const { data } = await api.get('/cart');
  return data;
};

export const addToCart = async (productId, quantity = 1, metadata = {}) => {
  const { data } = await api.post('/cart/add', { productId, quantity, ...metadata });
  return data;
};

export const updateCartItemQuantity = async (itemId, quantity) => {
  const { data } = await api.put('/cart/update', { itemId, quantity });
  return data;
};

export const removeFromCart = async (itemId) => {
  const { data } = await api.delete(`/cart/remove/${itemId}`);
  return data;
};

export const clearCart = async () => {
  const { data } = await api.delete('/cart/clear');
  return data;
};

/* -------------------------------------------------------------------------- */
/*                               ORDER SERVICE                                */
/* -------------------------------------------------------------------------- */

export const createOrder = async (payload) => {
  const { data } = await api.post('/orders', payload);
  return data;
};

export const getMyOrders = async () => {
  const { data } = await api.get('/orders/my');
  return data;
};

export const getOrderById = async (id) => {
  const { data } = await api.get(`/orders/${id}`);
  return data;
};

export const getAllOrders = async (params = {}) => {
  const { data } = await api.get('/orders', { params });
  return data;
};

export const updateOrderStatus = async (id, status) => {
  const { data } = await api.patch(`/orders/${id}/status`, { status });
  return data;
};

export const getOrderAnalytics = async () => {
  const { data } = await api.get('/orders/analytics');
  return data;
};

/* -------------------------------------------------------------------------- */
/*                               USER SERVICE                                 */
/* -------------------------------------------------------------------------- */

export const getProfile = async () => {
  const { data } = await api.get('/users/me');
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await api.put('/users/me', payload);
  return data;
};

export const getAllUsers = async () => {
  const { data } = await api.get('/users');
  return data;
};

export const updateUserRole = async (id, role) => {
  const { data } = await api.patch(`/users/${id}/role`, { role });
  return data;
};

export const getVendors = async () => {
  const { data } = await api.get('/users/vendors');
  return data;
};

export const toggleVendorStatus = async (id) => {
  const { data } = await api.patch(`/users/vendors/${id}/status`);
  return data;
};

export const getVendorProfile = async (id) => {
  const { data } = await api.get(`/users/vendors/${id}`);
  return data;
};

export const addAddress = async (payload) => {
  const { data } = await api.post('/users/addresses', payload);
  return data;
};

export const updateAddress = async (id, payload) => {
  const { data } = await api.put(`/users/addresses/${id}`, payload);
  return data;
};

export const deleteAddress = async (id) => {
  const { data } = await api.delete(`/users/addresses/${id}`);
  return data;
};

export const setDefaultAddress = async (id) => {
  const { data } = await api.patch(`/users/addresses/${id}/default`);
  return data;
};

/* -------------------------------------------------------------------------- */
/*                              WISHLIST SERVICE                              */
/* -------------------------------------------------------------------------- */

export const getWishlist = async () => {
  const { data } = await api.get('/users/wishlist');
  return data;
};

export const addToWishlist = async (productId) => {
  const { data } = await api.post('/users/wishlist', { productId });
  return data;
};

export const removeFromWishlist = async (productId) => {
  const { data } = await api.delete(`/users/wishlist/${productId}`);
  return data;
};

/* -------------------------------------------------------------------------- */
/*                             CATEGORY SERVICE                               */
/* -------------------------------------------------------------------------- */

export const getCategories = async () => {
  const { data } = await api.get('/categories');
  return data;
};

export const getCategoryBySlug = async (slug) => {
  const { data } = await api.get(`/categories/${slug}`);
  return data;
};

export const createCategory = async (name) => {
  const { data } = await api.post('/categories', { name });
  return data;
};

export const updateCategory = async (id, name) => {
  const { data } = await api.put(`/categories/${id}`, { name });
  return data;
};

export const deleteCategory = async (id) => {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
};

/* -------------------------------------------------------------------------- */
/*                           SUBCATEGORY SERVICE                              */
/* -------------------------------------------------------------------------- */

export const getSubcategories = async (categoryId) => {
  const params = categoryId ? { category: categoryId } : {};
  const { data } = await api.get('/subcategories', { params });
  return data;
};

export const createSubcategory = async (subData) => {
  const { data } = await api.post('/subcategories', subData);
  return data;
};

export const updateSubcategory = async (id, subData) => {
  const { data } = await api.put(`/subcategories/${id}`, subData);
  return data;
};

export const deleteSubcategory = async (id) => {
  const { data } = await api.delete(`/subcategories/${id}`);
  return data;
};

/* -------------------------------------------------------------------------- */
/*                               COUPON SERVICE                               */
/* -------------------------------------------------------------------------- */

export const getCoupons = async (params = {}) => {
  const { data } = await api.get('/coupons', { params });
  return data;
};

export const createCoupon = async (couponData) => {
  const { data } = await api.post('/coupons', couponData);
  return data;
};

export const updateCoupon = async (id, couponData) => {
  const { data } = await api.put(`/coupons/${id}`, couponData);
  return data;
};

export const deleteCoupon = async (id) => {
  const { data } = await api.delete(`/coupons/${id}`);
  return data;
};

export const applyCoupon = async (code, cartTotal, cartItems = []) => {
  const { data } = await api.post('/coupons/apply', { code, cartTotal, cartItems });
  return data;
};

/* -------------------------------------------------------------------------- */
/*                              PAYMENT SERVICE                               */
/* -------------------------------------------------------------------------- */

export const getPaymentConfig = async () => {
  const { data } = await api.get('/payments/config');
  return data;
};

export const createCheckout = async (payload) => {
  const { data } = await api.post('/payments/checkout', payload);
  return data;
};

export const verifyPayment = async (payload) => {
  const { data } = await api.post('/payments/verify', payload);
  return data;
};
