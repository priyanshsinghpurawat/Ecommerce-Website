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
    <div className="flex min-h-screen flex-col bg-app-bg font-sans text-app-text antialiased">
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

      {/* Mobile Bottom Navigation Bar (premium floating app-like experience) */}
      <div className="fixed bottom-6 left-0 right-0 z-40 lg:hidden px-6 pointer-events-none">
        <nav className="mx-auto max-w-sm pointer-events-auto flex items-center justify-around h-16 rounded-[2rem] bg-black/90 dark:bg-surface-50/95 backdrop-blur-2xl border border-white/10 dark:border-surface-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.3)] px-4">
          
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-center transition-all duration-300 ${
                isActive ? 'text-brand-primary scale-110' : 'text-white/40 dark:text-app-text/40 hover:text-white/70'
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
                isActive ? 'text-brand-primary scale-110' : 'text-white/40 dark:text-app-text/40 hover:text-white/70'
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
                isActive ? 'text-brand-primary scale-110' : 'text-white/40 dark:text-app-text/40 hover:text-white/70'
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
                isActive ? 'text-brand-primary scale-110' : 'text-white/40 dark:text-app-text/40 hover:text-white/70'
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
                isActive ? 'text-brand-primary scale-110' : 'text-white/40 dark:text-app-text/40 hover:text-white/70'
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
