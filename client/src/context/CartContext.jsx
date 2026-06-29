/** WHY: Global state for the shopping cart (adding items, clearing, subtotal). */
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext.jsx';
import * as cartService from '../services/cart.service.js';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [cart, setCart] = useState(null);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to compute aggregates from cart items
  const computeAggregates = (items = []) => {
    let count = 0;
    let total = 0;

    items.forEach((item) => {
      if (item.product) {
        count += item.quantity;
        const hasDiscount = item.product.discountedPrice !== null && item.product.discountedPrice !== undefined;
        const price = hasDiscount ? item.product.discountedPrice : item.product.price;
        total += price * item.quantity;
      }
    });

    setCartItemsCount(count);
    setCartTotal(total);
  };

  const fetchCart = useCallback(async () => {
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
        setError(err.response?.data?.message || 'Failed to fetch cart.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch cart automatically when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart(null);
      setCartItemsCount(0);
      setCartTotal(0);
    }
  }, [isAuthenticated, fetchCart]);

  const addToCart = async (productId, quantity = 1, metadata = {}) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Please log in to add items to your cart.' };
    }
    setError(null);
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
    if (!isAuthenticated) return { success: false, error: 'Please log in.' };
    setError(null);
    try {
      const response = await cartService.updateCartItemQuantity(itemId, quantity);
      if (response && response.success) {
        setCart(response.data);
        computeAggregates(response.data.items);
        return { success: true };
      }
      return { success: false, error: response?.message || 'Failed to update quantity.' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update quantity.';
      return { success: false, error: msg };
    }
  };

  const removeFromCart = async (itemId) => {
    if (!isAuthenticated) return { success: false, error: 'Please log in.' };
    setError(null);
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
    if (!isAuthenticated) return { success: false, error: 'Please log in.' };
    setError(null);
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
        clearLocalCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
