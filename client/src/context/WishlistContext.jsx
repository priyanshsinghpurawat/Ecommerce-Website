import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext.jsx';
import * as wishlistService from '../services/user.service.js';
import { toast } from 'react-hot-toast';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await wishlistService.getWishlist();
      setWishlist(res?.data || []);
    } catch (err) {
      if (err?.response?.status === 401) {
        setWishlist([]);
      } else {
        setError('Failed to load wishlist.');
        toast.error('Failed to load wishlist.');
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
        await fetchWishlist();
        return { success: true, action: 'added' };
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update wishlist.';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => (item._id || item) === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, loading, error, toggleWishlist, isInWishlist, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
