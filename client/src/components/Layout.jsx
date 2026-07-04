import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link, NavLink } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';
import { ScrollProgress } from './ScrollProgress.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Home as HomeIcon, ShoppingBag, Heart, User, Sparkles } from 'lucide-react';
import { useCart } from '../hooks/useCart.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { useAuth } from '../hooks/useAuth.js';
import api from '../services/api.js';

export const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItemsCount } = useCart();
  const { wishlist } = useWishlist();
  const { user, isAuthenticated } = useAuth();

  // Role-based landing redirect: only redirect on initial home-page hit,
  // so admin/seller can still browse the store via logo or direct URL.
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/') {
      if (user?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user?.role === 'seller') {
        navigate('/seller/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location.pathname]);

  // Affiliate Link Interceptor
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const refTag = queryParams.get('ref');
    
    if (refTag) {
      // 1. Save to local storage for 30 days (attribution window)
      const expiry = new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
      localStorage.setItem('mensvibe_affiliate_tag', JSON.stringify({ tag: refTag, expiry }));
      
      // 2. Track click on backend asynchronously (fire and forget)
      api.post(`/affiliates/track/${refTag}`).catch(err => console.error('Affiliate tracking failed', err));
    }
  }, [location.search]);

  return (
    <div className="flex min-h-screen flex-col bg-app-bg font-sans text-app-text antialiased">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-black focus:rounded-lg focus:text-sm focus:font-bold">
        Skip to main content
      </a>
      <ScrollProgress />
      <Navbar />
      <main id="main-content" className="flex-1 max-w-[1600px] w-full mx-auto px-4 md:px-8 relative pb-24 md:pb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />

      {/* Mobile Bottom Navigation Bar (premium floating app-like experience) */}
      <div className="fixed bottom-6 left-0 right-0 z-40 lg:hidden px-6 pointer-events-none">
        <nav className="mx-auto max-w-sm pointer-events-auto flex items-center justify-around h-16 rounded-[2rem] bg-black/90 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] px-4">
          
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-center transition-all duration-300 ${
                isActive ? 'text-brand-primary scale-110' : 'text-white/40 hover:text-white/70'
              }`
            }
          >
            <HomeIcon className="h-5 w-5" />
            <span className="text-[7px] font-black uppercase tracking-[0.2em] mt-1">Home</span>
          </NavLink>

          <NavLink
            to="/shop"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-center transition-all duration-300 ${
                isActive ? 'text-brand-primary scale-110' : 'text-white/40 hover:text-white/70'
              }`
            }
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="text-[7px] font-black uppercase tracking-[0.2em] mt-1">Shop</span>
          </NavLink>

          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-center transition-all duration-300 relative ${
                isActive ? 'text-brand-primary scale-110' : 'text-white/40 hover:text-white/70'
              }`
            }
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[8px] font-black text-black ring-2 ring-black animate-in zoom-in duration-300">
                  {cartItemsCount}
                </span>
              )}
            </div>
            <span className="text-[7px] font-black uppercase tracking-[0.2em] mt-1">Cart</span>
          </NavLink>

          <NavLink
            to="/wishlist"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-center transition-all duration-300 relative ${
                isActive ? 'text-brand-primary scale-110' : 'text-white/40 hover:text-white/70'
              }`
            }
          >
            <div className="relative">
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-black animate-in zoom-in duration-300">
                  {wishlist.length}
                </span>
              )}
            </div>
            <span className="text-[7px] font-black uppercase tracking-[0.2em] mt-1">Wish</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-center transition-all duration-300 ${
                isActive ? 'text-brand-primary scale-110' : 'text-white/40 hover:text-white/70'
              }`
            }
          >
            <User className="h-5 w-5" />
            <span className="text-[7px] font-black uppercase tracking-[0.2em] mt-1">Me</span>
          </NavLink>

        </nav>
      </div>

    </div>
  );
};
