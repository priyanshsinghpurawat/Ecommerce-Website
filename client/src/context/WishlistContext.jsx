import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext.jsx';
import * as wishlistService from '../services/api.js';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await wishlistService.getWishlist();
      setWishlist(res?.data || []);
    } catch (err) {
      if (err?.response?.status === 401) {
        setWishlist([]);
      } else {
        console.error('Failed to fetch wishlist', err);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      setWishlist([]);
    }
  }, [isAuthenticated, fetchWishlist]);

  const toggleWishlist = async (productId) => {
    if (!isAuthenticated) return { success: false, error: 'Please log in.' };
    
    const isWishlisted = wishlist.some(item => (item._id || item) === productId);
    
    try {
      if (isWishlisted) {
        await wishlistService.removeFromWishlist(productId);
        setWishlist(prev => prev.filter(item => (item._id || item) !== productId));
        return { success: true, action: 'removed' };
      } else {
        await wishlistService.addToWishlist(productId);
        // Refresh wishlist to get populated product data if needed, 
        // or just add the ID if we only care about the state.
        // For simplicity and immediate UI update:
        setWishlist(prev => [...prev, productId]); 
        fetchWishlist(); // Fetch to get full data
        return { success: true, action: 'added' };
      }
    } catch (err) {
      return { success: false, error: 'Action failed' };
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => (item._id || item) === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, loading, toggleWishlist, isInWishlist, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
