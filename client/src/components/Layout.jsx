import React from 'react';
import { Outlet, useLocation, Link, NavLink } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Home as HomeIcon, ShoppingBag, Heart, User, Sparkles } from 'lucide-react';
import { useCart } from '../hooks/useCart.js';
import { useWishlist } from '../hooks/useWishlist.js';

export const Layout = () => {
  const location = useLocation();
  const { cartItemsCount } = useCart();
  const { wishlist } = useWishlist();

  return (
    <div className="flex min-h-screen flex-col bg-lux-bg font-sans text-lux-dark antialiased">
      <Navbar />
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 md:px-8 py-6 md:py-10 relative pb-24 md:pb-10">
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

      {/* Mobile Bottom Navigation Bar (app-like experience) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden px-4 pb-4 bg-gradient-to-t from-lux-bg via-lux-bg/80 to-transparent pointer-events-none">
        <nav className="mx-auto max-w-md pointer-events-auto flex items-center justify-around h-14 rounded-2xl bg-black/90 dark:bg-lux-50/95 backdrop-blur-xl border border-white/10 dark:border-lux-200/50 shadow-2xl px-2">
          
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-center transition-colors ${
                isActive ? 'text-lux-primary' : 'text-white/50 dark:text-lux-dark/50'
              }`
            }
          >
            <HomeIcon className="h-4.5 w-4.5" />
            <span className="text-[8px] font-black uppercase tracking-widest mt-0.5">Home</span>
          </NavLink>

          <NavLink
            to="/shop"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-center transition-colors ${
                isActive ? 'text-lux-primary' : 'text-white/50 dark:text-lux-dark/50'
              }`
            }
          >
            <ShoppingBag className="h-4.5 w-4.5" />
            <span className="text-[8px] font-black uppercase tracking-widest mt-0.5">Shop</span>
          </NavLink>

          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-center transition-colors relative ${
                isActive ? 'text-lux-primary' : 'text-white/50 dark:text-lux-dark/50'
              }`
            }
          >
            <ShoppingBag className="h-4.5 w-4.5" />
            {cartItemsCount > 0 && (
              <span className="absolute top-0 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-lux-primary text-[8px] font-bold text-black ring-1 ring-black animate-bounce">
                {cartItemsCount}
              </span>
            )}
            <span className="text-[8px] font-black uppercase tracking-widest mt-0.5">Cart</span>
          </NavLink>

          <NavLink
            to="/wishlist"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-center transition-colors relative ${
                isActive ? 'text-lux-primary' : 'text-white/50 dark:text-lux-dark/50'
              }`
            }
          >
            <Heart className="h-4.5 w-4.5" />
            {wishlist.length > 0 && (
              <span className="absolute top-0 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-1 ring-white">
                {wishlist.length}
              </span>
            )}
            <span className="text-[8px] font-black uppercase tracking-widest mt-0.5">Wishlist</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-center transition-colors ${
                isActive ? 'text-lux-primary' : 'text-white/50 dark:text-lux-dark/50'
              }`
            }
          >
            <User className="h-4.5 w-4.5" />
            <span className="text-[8px] font-black uppercase tracking-widest mt-0.5">Profile</span>
          </NavLink>

        </nav>
      </div>

    </div>
  );
};
