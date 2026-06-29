import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/category.service.js', () => ({
  getCategories: vi.fn(),
  getCategoryBySlug: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn()
}));

vi.mock('../services/product.service.js', () => ({
  getProducts: vi.fn(),
  getProductFilters: vi.fn(),
  getProductById: vi.fn(),
  getFrequentlyBoughtTogether: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  getProductColors: vi.fn(),
  getProductVariants: vi.fn(),
  generateVariants: vi.fn(),
  bulkUpsertVariants: vi.fn(),
  updateVariantStock: vi.fn(),
  deleteVariant: vi.fn(),
  toggleSkuLock: vi.fn(),
  bulkUpdateStock: vi.fn()
}));

vi.mock('../services/user.service.js', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  getAllUsers: vi.fn(),
  updateUserRole: vi.fn(),
  getVendors: vi.fn(),
  toggleVendorStatus: vi.fn(),
  getVendorProfile: vi.fn(),
  addAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
  setDefaultAddress: vi.fn(),
  getWishlist: vi.fn(),
  addToWishlist: vi.fn(),
  removeFromWishlist: vi.fn()
}));

vi.mock('../services/cart.service.js', () => ({
  getCart: vi.fn(),
  addToCart: vi.fn(),
  updateCartItemQuantity: vi.fn(),
  removeFromCart: vi.fn(),
  clearCart: vi.fn()
}));

vi.mock('../services/coupon.service.js', () => ({
  getCoupons: vi.fn(),
  createCoupon: vi.fn(),
  updateCoupon: vi.fn(),
  deleteCoupon: vi.fn(),
  applyCoupon: vi.fn()
}));

vi.mock('../services/order.service.js', () => ({
  createOrder: vi.fn(),
  getMyOrders: vi.fn(),
  getOrderById: vi.fn(),
  getAllOrders: vi.fn(),
  updateOrderStatus: vi.fn(),
  getOrderAnalytics: vi.fn()
}));

vi.mock('../services/payment.service.js', () => ({
  getPaymentConfig: vi.fn(),
  createCheckout: vi.fn(),
  verifyPayment: vi.fn()
}));

import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/category.service.js';
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getProductFilters, getProductById, getProductVariants
} from '../services/product.service.js';
import {
  getProfile, updateProfile, getAllUsers, updateUserRole,
  getVendors, toggleVendorStatus, addAddress, updateAddress, deleteAddress, setDefaultAddress,
  getWishlist, addToWishlist, removeFromWishlist
} from '../services/user.service.js';
import { getCart, addToCart, updateCartItemQuantity, removeFromCart, clearCart } from '../services/cart.service.js';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, applyCoupon } from '../services/coupon.service.js';
import { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus } from '../services/order.service.js';
import { getPaymentConfig, createCheckout, verifyPayment } from '../services/payment.service.js';

// ── Category Service ──
describe('Category Service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getCategories calls GET /categories', async () => {
    getCategories.mockResolvedValue({ data: [] });
    await getCategories();
    expect(getCategories).toHaveBeenCalled();
  });

  it('createCategory calls create with data', async () => {
    createCategory.mockResolvedValue({ data: { _id: '1', name: 'New' } });
    const result = await createCategory({ name: 'New' });
    expect(result.data.name).toBe('New');
  });

  it('updateCategory calls update with id and data', async () => {
    updateCategory.mockResolvedValue({ data: { _id: '1', name: 'Updated' } });
    await updateCategory('1', { name: 'Updated' });
    expect(updateCategory).toHaveBeenCalledWith('1', { name: 'Updated' });
  });

  it('deleteCategory calls delete with id', async () => {
    deleteCategory.mockResolvedValue({ data: null });
    await deleteCategory('1');
    expect(deleteCategory).toHaveBeenCalledWith('1');
  });
});

// ── Product Service ──
describe('Product Service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getProducts calls GET /products with params', async () => {
    getProducts.mockResolvedValue({ data: [] });
    await getProducts({ page: 1, limit: 10 });
    expect(getProducts).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it('getProductFilters calls GET /products/filters', async () => {
    getProductFilters.mockResolvedValue({ data: {} });
    await getProductFilters();
    expect(getProductFilters).toHaveBeenCalled();
  });

  it('getProductById calls GET /products/:id', async () => {
    getProductById.mockResolvedValue({ data: { _id: '1' } });
    await getProductById('1');
    expect(getProductById).toHaveBeenCalledWith('1');
  });

  it('createProduct calls POST with data', async () => {
    createProduct.mockResolvedValue({ data: { _id: '1' } });
    await createProduct({ title: 'Test' });
    expect(createProduct).toHaveBeenCalledWith({ title: 'Test' });
  });

  it('updateProduct calls PUT with id and data', async () => {
    updateProduct.mockResolvedValue({ data: { _id: '1' } });
    await updateProduct('1', { title: 'Updated' });
    expect(updateProduct).toHaveBeenCalledWith('1', { title: 'Updated' });
  });

  it('deleteProduct calls DELETE with id', async () => {
    deleteProduct.mockResolvedValue({ data: null });
    await deleteProduct('1');
    expect(deleteProduct).toHaveBeenCalledWith('1');
  });

  it('getProductVariants calls GET /products/:id/variants', async () => {
    getProductVariants.mockResolvedValue({ data: [] });
    await getProductVariants('p1');
    expect(getProductVariants).toHaveBeenCalledWith('p1');
  });
});

// ── User Service ──
describe('User Service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getProfile calls GET /users/me', async () => {
    getProfile.mockResolvedValue({ data: { name: 'Test' } });
    await getProfile();
    expect(getProfile).toHaveBeenCalled();
  });

  it('updateProfile calls PUT /users/me', async () => {
    updateProfile.mockResolvedValue({ data: { name: 'Updated' } });
    await updateProfile({ name: 'Updated' });
    expect(updateProfile).toHaveBeenCalledWith({ name: 'Updated' });
  });

  it('getAllUsers calls GET /users', async () => {
    getAllUsers.mockResolvedValue({ data: [] });
    await getAllUsers();
    expect(getAllUsers).toHaveBeenCalled();
  });

  it('updateUserRole calls PATCH /users/:id/role', async () => {
    updateUserRole.mockResolvedValue({ data: {} });
    await updateUserRole('u1', 'admin');
    expect(updateUserRole).toHaveBeenCalledWith('u1', 'admin');
  });

  it('addAddress calls POST /users/addresses', async () => {
    addAddress.mockResolvedValue({ data: {} });
    await addAddress({ street: '123 Main' });
    expect(addAddress).toHaveBeenCalledWith({ street: '123 Main' });
  });

  it('deleteAddress calls DELETE /users/addresses/:id', async () => {
    deleteAddress.mockResolvedValue({ data: null });
    await deleteAddress('a1');
    expect(deleteAddress).toHaveBeenCalledWith('a1');
  });

  it('setDefaultAddress calls PATCH /users/addresses/:id/default', async () => {
    setDefaultAddress.mockResolvedValue({ data: {} });
    await setDefaultAddress('a1');
    expect(setDefaultAddress).toHaveBeenCalledWith('a1');
  });

  it('getWishlist calls GET /users/wishlist', async () => {
    getWishlist.mockResolvedValue({ data: [] });
    await getWishlist();
    expect(getWishlist).toHaveBeenCalled();
  });

  it('addToWishlist calls POST /users/wishlist', async () => {
    addToWishlist.mockResolvedValue({ data: {} });
    await addToWishlist('p1');
    expect(addToWishlist).toHaveBeenCalledWith('p1');
  });

  it('removeFromWishlist calls DELETE /users/wishlist/:id', async () => {
    removeFromWishlist.mockResolvedValue({ data: null });
    await removeFromWishlist('p1');
    expect(removeFromWishlist).toHaveBeenCalledWith('p1');
  });
});

// ── Cart Service ──
describe('Cart Service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getCart calls GET /cart', async () => {
    getCart.mockResolvedValue({ data: { items: [] } });
    await getCart();
    expect(getCart).toHaveBeenCalled();
  });

  it('addToCart calls POST /cart/add', async () => {
    addToCart.mockResolvedValue({ data: {} });
    await addToCart({ productId: 'p1', quantity: 1 });
    expect(addToCart).toHaveBeenCalledWith({ productId: 'p1', quantity: 1 });
  });

  it('updateCartItemQuantity calls PUT /cart/update', async () => {
    updateCartItemQuantity.mockResolvedValue({ data: {} });
    await updateCartItemQuantity({ itemId: 'i1', quantity: 3 });
    expect(updateCartItemQuantity).toHaveBeenCalledWith({ itemId: 'i1', quantity: 3 });
  });

  it('removeFromCart calls DELETE /cart/remove/:itemId', async () => {
    removeFromCart.mockResolvedValue({ data: null });
    await removeFromCart('i1');
    expect(removeFromCart).toHaveBeenCalledWith('i1');
  });

  it('clearCart calls DELETE /cart/clear', async () => {
    clearCart.mockResolvedValue({ data: null });
    await clearCart();
    expect(clearCart).toHaveBeenCalled();
  });
});

// ── Coupon Service ──
describe('Coupon Service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getCoupons calls GET /coupons', async () => {
    getCoupons.mockResolvedValue({ data: [] });
    await getCoupons();
    expect(getCoupons).toHaveBeenCalled();
  });

  it('createCoupon calls POST /coupons', async () => {
    createCoupon.mockResolvedValue({ data: { code: 'SAVE10' } });
    await createCoupon({ code: 'SAVE10', discountType: 'percentage', discountValue: 10 });
    expect(createCoupon).toHaveBeenCalled();
  });

  it('applyCoupon calls POST /coupons/apply', async () => {
    applyCoupon.mockResolvedValue({ data: { discountAmount: 100 } });
    await applyCoupon({ code: 'SAVE10' });
    expect(applyCoupon).toHaveBeenCalledWith({ code: 'SAVE10' });
  });

  it('deleteCoupon calls DELETE /coupons/:id', async () => {
    deleteCoupon.mockResolvedValue({ data: null });
    await deleteCoupon('c1');
    expect(deleteCoupon).toHaveBeenCalledWith('c1');
  });
});

// ── Order Service ──
describe('Order Service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('createOrder calls POST /orders', async () => {
    createOrder.mockResolvedValue({ data: { orderNumber: 'BL-1' } });
    await createOrder({ shippingAddress: {} });
    expect(createOrder).toHaveBeenCalled();
  });

  it('getMyOrders calls GET /orders/my', async () => {
    getMyOrders.mockResolvedValue({ data: [] });
    await getMyOrders();
    expect(getMyOrders).toHaveBeenCalled();
  });

  it('getAllOrders calls GET /orders', async () => {
    getAllOrders.mockResolvedValue({ data: [] });
    await getAllOrders();
    expect(getAllOrders).toHaveBeenCalled();
  });

  it('updateOrderStatus calls PATCH /orders/:id/status', async () => {
    updateOrderStatus.mockResolvedValue({ data: {} });
    await updateOrderStatus('o1', { status: 'shipped' });
    expect(updateOrderStatus).toHaveBeenCalledWith('o1', { status: 'shipped' });
  });
});

// ── Payment Service ──
describe('Payment Service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getPaymentConfig calls GET /payments/config', async () => {
    getPaymentConfig.mockResolvedValue({ data: { razorpayEnabled: true } });
    const result = await getPaymentConfig();
    expect(result.data.razorpayEnabled).toBe(true);
  });

  it('createCheckout calls POST /payments/checkout', async () => {
    createCheckout.mockResolvedValue({ data: { orderId: 'order_1' } });
    await createCheckout({ amount: 1000 });
    expect(createCheckout).toHaveBeenCalledWith({ amount: 1000 });
  });

  it('verifyPayment calls POST /payments/verify', async () => {
    verifyPayment.mockResolvedValue({ data: { verified: true } });
    await verifyPayment({ razorpay_payment_id: 'pay_1' });
    expect(verifyPayment).toHaveBeenCalledWith({ razorpay_payment_id: 'pay_1' });
  });
});
