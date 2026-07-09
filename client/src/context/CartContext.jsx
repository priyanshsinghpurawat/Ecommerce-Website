import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext.jsx';
import * as cartService from '../services/cart.service.js';
import { toast } from 'react-hot-toast';

const GUEST_CART_KEY = 'guest_cart';

const loadGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveGuestCart = (items) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

const clearGuestCart = () => {
  localStorage.removeItem(GUEST_CART_KEY);
};

/**
 * Generate a stable local ID for guest cart items so React keys don't flicker.
 */
let localIdCounter = Date.now();
const nextLocalId = () => `guest_${++localIdCounter}`;

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [cart, setCart] = useState(null);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const computeAggregates = (items = []) => {
    let count = 0;
    let total = 0;
    for (const item of items) {
      if (item.product) {
        count += item.quantity;
        const hasDiscount = item.product.discountedPrice != null;
        const price = hasDiscount ? item.product.discountedPrice : item.product.price;
        total += price * item.quantity;
      }
    }
    setCartItemsCount(count);
    setCartTotal(total);
  };

  // Build a fake cart shape from guest items for the UI
  const buildGuestCart = useCallback((guestItems) => {
    return { _id: null, user: null, items: guestItems };
  }, []);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      const guestItems = loadGuestCart();
      setCart(buildGuestCart(guestItems));
      computeAggregates(guestItems);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await cartService.getCart();
      if (response && response.success && response.data) {
        setCart(response.data);
        computeAggregates(response.data.items);
      } else {
        setCart(null);
        setCartItemsCount(0);
        setCartTotal(0);
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        setCart(null);
        setCartItemsCount(0);
        setCartTotal(0);
      } else {
        const msg = err.response?.data?.message || 'Failed to fetch cart.';
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, buildGuestCart]);

  // Merge guest cart into server cart when user logs in
  const mergeGuestCart = useCallback(async () => {
    const guestItems = loadGuestCart();
    if (guestItems.length === 0) return;

    try {
      const payload = guestItems.map((item) => ({
        productId: item.product._id || item.productId,
        variantId: item.variant || item.variantId || undefined,
        quantity: item.quantity,
        size: item.size || '',
        color: item.color || '',
      }));
      await cartService.mergeCart(payload);
      clearGuestCart();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to merge your guest cart items.';
      setError(msg);
      toast.error(msg);
    }
  }, []);

  // On auth change: fetch server cart or load guest cart
  useEffect(() => {
    if (isAuthenticated) {
      mergeGuestCart().finally(() => fetchCart());
    } else {
      const guestItems = loadGuestCart();
      setCart(buildGuestCart(guestItems));
      computeAggregates(guestItems);
    }
  }, [isAuthenticated, fetchCart, mergeGuestCart, buildGuestCart]);

  // Need a re-fetch when user identity changes (e.g. after registration)
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCart();
    }
  }, [user?._id]);

  const addToCart = async (productId, quantity = 1, metadata = {}) => {
    setError(null);

    if (!isAuthenticated) {
      // Guest path: store in localStorage
      const guestItems = loadGuestCart();
      const existingIdx = guestItems.findIndex(
        (item) =>
          item.productId === productId &&
          (item.variantId || null) === (metadata.variantId || null) &&
          (item.size || '') === (metadata.size || '') &&
          (item.color || '') === (metadata.color || '')
      );

      if (existingIdx >= 0) {
        guestItems[existingIdx].quantity += quantity;
      } else {
        guestItems.push({
          _id: nextLocalId(),
          productId,
          product: { _id: productId, price: metadata.price || 0, discountedPrice: metadata.discountedPrice ?? null, image: metadata.image || '', title: metadata.title || 'Item' },
          variantId: metadata.variantId || null,
          quantity,
          size: metadata.size || '',
          color: metadata.color || '',
        });
      }

      saveGuestCart(guestItems);
      setCart(buildGuestCart(guestItems));
      computeAggregates(guestItems);
      return { success: true };
    }

    try {
      const response = await cartService.addToCart(productId, quantity, metadata);
      if (response && response.success) {
        setCart(response.data);
        computeAggregates(response.data.items);
        return { success: true };
      }
      return { success: false, error: response?.message || 'Failed to add item to cart.' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add item to cart.';
      return { success: false, error: msg };
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    setError(null);

    if (!isAuthenticated) {
      const guestItems = loadGuestCart();
      const item = guestItems.find((i) => i._id === itemId);
      if (item) {
        item.quantity = quantity;
        saveGuestCart(guestItems);
        setCart(buildGuestCart(guestItems));
        computeAggregates(guestItems);
      }
      return { success: true };
    }

    // Save previous state for rollback on API failure
    const prevCart = cart ? { ...cart, items: [...(cart.items || [])] } : null;

    // Optimistic update — apply immediately, no waiting
    if (cart?.items) {
      const updatedItems = cart.items.map((item) =>
        item._id === itemId ? { ...item, quantity } : item,
      );
      setCart({ ...cart, items: updatedItems });
      computeAggregates(updatedItems);
    }

    try {
      const response = await cartService.updateCartItemQuantity(itemId, quantity);
      if (response && response.success) {
        setCart(response.data);
        computeAggregates(response.data.items);
        return { success: true };
      }
      throw new Error(response?.message || 'Failed to update quantity.');
    } catch (err) {
      // Rollback to previous state
      if (prevCart) {
        setCart(prevCart);
        computeAggregates(prevCart.items || []);
      }
      const msg = err.response?.data?.message || err.message || 'Failed to update quantity.';
      return { success: false, error: msg };
    }
  };

  const removeFromCart = async (itemId) => {
    setError(null);

    if (!isAuthenticated) {
      let guestItems = loadGuestCart();
      guestItems = guestItems.filter((i) => i._id !== itemId);
      saveGuestCart(guestItems);
      setCart(buildGuestCart(guestItems));
      computeAggregates(guestItems);
      return { success: true };
    }

    try {
      const response = await cartService.removeFromCart(itemId);
      if (response && response.success) {
        setCart(response.data);
        computeAggregates(response.data.items);
        return { success: true };
      }
      return { success: false, error: response?.message || 'Failed to remove item.' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove item.';
      return { success: false, error: msg };
    }
  };

  const clearCart = async () => {
    setError(null);

    if (!isAuthenticated) {
      clearGuestCart();
      setCart(buildGuestCart([]));
      computeAggregates([]);
      return { success: true };
    }

    try {
      const response = await cartService.clearCart();
      if (response && response.success) {
        setCart(response.data);
        computeAggregates([]);
        return { success: true };
      }
      return { success: false, error: response?.message || 'Failed to clear cart.' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to clear cart.';
      return { success: false, error: msg };
    }
  };

  const clearLocalCart = () => {
    setCart(null);
    computeAggregates([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItemsCount,
        cartTotal,
        loading,
        error,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        clearLocalCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};