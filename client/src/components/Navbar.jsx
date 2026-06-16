import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { User, LogOut, LayoutDashboard, ShoppingBag, Package, Search, Menu, X, Heart, Moon, Sun, ChevronDown, Zap, Loader2, ArrowRight } from 'lucide-react';
import { useCart } from '../hooks/useCart.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { useCategories } from '../hooks/useCategories.js';
import { getSubcategories, getProducts } from '../services/api.js';
import { resolveImageUrl } from '../utils/helpers.js';
import { FEATURED_SUBCATEGORY_NAMES } from '../constants/showcase.js';
import { motion } from 'framer-motion';

// Hoisted motion variants for better performance
const HEART_ANIMATION = { scale: [1, 1.3, 0.9, 1] };
const CART_ANIMATION = { scale: [1, 1.25, 0.95, 1] };
const SPRING_TRANSITION = { duration: 0.35, ease: 'easeOut' };

// Mobile Accordion Component - Memoized to prevent unnecessary re-renders
const MobileCategoryAccordion = React.memo(({ category, onClose }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/5 bg-white/5 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-white"
      >
        <span>{category.name}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div className="px-5 pb-4 pt-1 flex flex-col gap-2.5 border-t border-white/5 bg-black/40">
          <Link
            to={`/shop?category=${category._id}`}
            onClick={onClose}
            className="text-[10px] font-black text-brand-primary uppercase tracking-wider"
          >
            Shop All {category.name}
          </Link>
          {category.subcategories?.map((sub) => (
            <Link
              key={sub._id}
              to={`/shop?subcategory=${sub._id}`}
              onClick={onClose}
              className="text-[10px] font-bold text-white/65 hover:text-white uppercase tracking-wider"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
});

MobileCategoryAccordion.displayName = 'MobileCategoryAccordion';

/**
 * NAVBAR COMPONENT
 * 
 * Handles sticky top layout, debounced global autosuggest search,
 * user authentication profile links, and the new Category Mega Menu.
 */
export const Navbar = () => {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const { cartItemsCount } = useCart();
  const { wishlist } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const { categories, fetchCategories } = useCategories();
  const navigate = useNavigate();

  // Local State
  const [subcategories, setSubcategories] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  const menuRef = useRef(null);
  const searchRef = useRef(null);

  // Fetch data on mount
  useEffect(() => {
    getSubcategories()
      .then((res) => setSubcategories(res?.data || []))
      .catch(() => setSubcategories([]));
    fetchCategories();
  }, [fetchCategories]);

  // Click outside menus to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Autosuggest Query
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await getProducts({ search: searchQuery.trim(), limit: 5 });
        if (response?.data?.products) {
          setSuggestions(response.data.products);
        }
      } catch (err) {
        console.error('Autosuggest failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Group subcategories by parent category ID
  const categoriesWithSubs = useMemo(() => {
    return categories.map(cat => {
      const subs = subcategories.filter(sub => {
        const parentId = typeof sub.category === 'object' ? sub.category?._id : sub.category;
        return parentId === cat._id;
      });
      return { ...cat, subcategories: subs };
    });
  }, [categories, subcategories]);

  const handleLogout = () => {
    logoutUser();
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSuggestions([]);
      setSearchQuery('');
    }
  };

  const handleSuggestionClick = (productId) => {
    navigate(`/product/${productId}`);
    setSearchOpen(false);
    setSuggestions([]);
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-50 glass shadow-nav transition-all duration-300">
      <div className="border-b border-black/5 dark:border-white/5">
        <div className="w-full px-2 md:px-4 h-14 flex items-center justify-between gap-4">

          {/* 1. LOGO SECTION (Absolute Viewport Left) */}
          <Link to="/" className="flex items-center gap-1.5 shrink-0 group relative">
            <div className="relative">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-brand-primary to-[#00a8cc] text-[15px] font-black text-black group-hover:scale-110 group-hover:rotate-[10deg] transition-all duration-500 shadow-lg group-hover:shadow-brand-primary/50 z-10 relative">
                M
              </span>
              {/* Animated Glow Backdrop */}
              <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-[#00a8cc] opacity-0 group-hover:opacity-40 blur-xl transition-all duration-500 rounded-full scale-150" />
            </div>

            <div className="flex flex-col -gap-1">
              <span className="text-[16px] uppercase tracking-widest bg-gradient-to-r from-brand-primary to-[#00a8cc] bg-clip-text text-transparent transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(0,168,204,0.4)] group-hover:brightness-110">
                <span className="font-black">Mens</span><span className="font-light">Vibe</span>
              </span>
              <div className="h-[2px] w-0 group-hover:w-full bg-gradient-to-r from-brand-primary to-[#00a8cc] transition-all duration-500 rounded-full" />
            </div>
          </Link>

          {/* 2. MAIN NAVIGATION (Desktop - Centered) */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center px-8">
            {searchOpen ? (
              <div ref={searchRef} className="relative flex-1 max-w-sm mx-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Find your vibe..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-full border border-surface-200 bg-surface-50 px-4 py-1.5 pl-10 pr-10 text-xs focus:outline-none focus:border-brand-primary transition-all shadow-inner"
                    />
                    <Search className="absolute left-3.5 top-2 h-3.5 w-3.5 text-app-text/45" />

                    {searching ? (
                      <Loader2 className="absolute right-10 top-2 h-3.5 w-3.5 animate-spin text-app-text/45" />
                    ) : null}

                    <button
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        setSuggestions([]);
                        setSearchQuery('');
                      }}
                      className="absolute right-3 top-2 text-app-text/30 hover:text-app-text"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </form>

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 ? (
                  <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden z-50 py-2 divide-y divide-white/5">
                    <div className="px-4 py-1.5 text-[8px] font-black uppercase tracking-wider text-brand-primary">
                      Matching Products
                    </div>
                    {suggestions.map((product) => (
                      <button
                        key={product._id}
                        onClick={() => handleSuggestionClick(product._id)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-left transition-colors"
                      >
                        <img
                          src={resolveImageUrl(product.images?.[0] || product.image, product.title)}
                          alt=""
                          className="h-8 w-8 rounded-lg object-cover bg-white/10 border border-white/5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-white truncate">{product.title}</p>
                          <p className="text-[8px] font-medium text-white/40 uppercase tracking-wider">
                            {product.category?.name || 'Category'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-brand-primary">
                            ₹{product.discountedPrice > 0 ? product.discountedPrice : product.price}
                          </p>
                          {product.discountedPrice > 0 ? (
                            <p className="text-[8px] font-bold text-white/35 line-through">
                              ₹{product.price}
                            </p>
                          ) : null}
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full text-center py-2 text-[9px] font-black uppercase tracking-widest text-brand-primary hover:bg-white/5 transition-colors"
                    >
                      View all results
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <NavLink
                  to="/shop"
                  className={({ isActive }) =>
                    `px-3 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-1 ${isActive ? 'text-brand-primary underline underline-offset-4' : 'text-app-text/55 hover:text-app-text'
                    }`
                  }
                >
                  Shop
                </NavLink>

                <NavLink
                  to="/street-drip"
                  className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-1 transition-all group/drip"
                >
                  {({ isActive }) => (
                    <>
                      <Zap className={`h-3 w-3 transition-colors ${isActive ? 'text-brand-primary' : 'text-app-text/55 group-hover/drip:text-brand-primary'}`} />
                      <span className={`transition-all ${isActive ? 'text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-[#00a8cc]' : 'text-app-text/55 group-hover/drip:text-transparent group-hover/drip:bg-clip-text group-hover/drip:bg-gradient-to-r group-hover/drip:from-brand-primary group-hover/drip:to-[#00a8cc]'}`}>
                        Street Drip
                      </span>
                    </>
                  )}
                </NavLink>

                {/* Flat quicklinks to subcategories */}
                {subcategories.slice(0, 3).map((sub) => (
                  <NavLink
                    key={sub._id}
                    to={`/shop?subcategory=${sub._id}`}
                    className={({ isActive }) =>
                      `px-3 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${isActive ? 'text-brand-primary font-black' : 'text-app-text/55 hover:text-app-text'
                      }`
                    }
                  >
                    {sub.name}
                  </NavLink>
                ))}
              </div>
            )}
          </nav>

          {/* 3. ACTION ICONS */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {!searchOpen ? (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg text-app-text/60 hover:bg-surface-50 hover:text-app-text transition-all"
                title="Search shop"
              >
                <Search className="h-4 w-4" />
              </button>
            ) : null}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-app-text/60 hover:bg-surface-50 hover:text-app-text transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link to="/wishlist" className="relative p-2 rounded-lg text-app-text/60 hover:bg-surface-50 hidden sm:block">
              <motion.div
                key={wishlist.length}
                animate={HEART_ANIMATION}
                transition={SPRING_TRANSITION}
              >
                <Heart className="h-4 w-4" />
              </motion.div>
              {wishlist.length > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-white">
                  {wishlist.length}
                </span>
              ) : null}
            </Link>

            <Link to="/cart" className="relative p-2 rounded-lg text-app-text/60 hover:bg-surface-50">
              <motion.div
                key={cartItemsCount}
                animate={CART_ANIMATION}
                transition={SPRING_TRANSITION}
              >
                <ShoppingBag className="h-4 w-4" />
              </motion.div>
              {cartItemsCount > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[8px] font-bold text-white ring-2 ring-white">
                  {cartItemsCount > 9 ? '9+' : cartItemsCount}
                </span>
              ) : null}
            </Link>

            {/* AUTH SECTION */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Admin/Seller Quick Access Button */}
                {(user?.role === 'admin' || user?.role === 'seller') ? (
                  <Link
                    to={user.role === 'admin' ? '/admin/dashboard' : '/seller/dashboard'}
                    className="hidden md:flex items-center gap-2   px-4 py-1.5 rounded-xl bg-brand-primary text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-brand-primary/20"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    {user.role === 'admin' ? 'Admin Console' : 'Vendor Station'}
                  </Link>
                ) : null}

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 bg-app-text/5 border border-surface-100 hover:bg-app-text/10 transition-all active:scale-95"
                  >
                    <div className="h-7 w-7 rounded-full bg-app-text text-brand-primary flex items-center justify-center overflow-hidden border border-white/10">
                      {user?.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : <User className="h-3.5 w-3.5" />}
                    </div>
                    <ChevronDown className={`h-3 w-3 text-app-text/40 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen ? (
                    <div className="absolute right-0 mt-3 w-56 origin-top-right rounded-3xl bg-black/90 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-5 py-4 border-b border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Signed in as</p>
                        <p className="text-xs font-bold text-white truncate mt-0.5">{user?.name}</p>
                      </div>

                      <div className="p-2">
                        <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-brand-primary hover:bg-white/5 rounded-2xl transition-all">
                          <User className="h-3.5 w-3.5" /> Account Details
                        </Link>
                        <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-brand-primary hover:bg-white/5 rounded-2xl transition-all">
                          <Package className="h-3.5 w-3.5" /> Purchase History
                        </Link>
                      </div>

                      <div className="p-2 border-t border-white/5 bg-white/5">
                        <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors">
                          <LogOut className="h-3.5 w-3.5" /> Sign Out
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <Link to="/login" className="hidden sm:flex items-center gap-2 rounded-xl bg-app-text px-5 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-app-bg hover:bg-brand-primary hover:text-black transition-all shadow-xl">
                Enter Vibe
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button type="button" className="lg:hidden p-2 text-app-text" onClick={() => setMobileOpen((o) => !o)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>



      {/* MOBILE MENU */}
      {mobileOpen ? (
        <div className="lg:hidden border-b border-surface-100 bg-black/95 backdrop-blur-3xl px-4 py-6 flex flex-col gap-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-wrap gap-2">
            <Link to="/shop" onClick={() => setMobileOpen(false)} className="rounded-xl bg-brand-primary px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-black shadow-xl">
              Catalog
            </Link>
            <Link to="/street-drip" onClick={() => setMobileOpen(false)} className="rounded-xl bg-gradient-to-r from-brand-primary to-[#00a8cc] px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-black shadow-xl">
              Street Drip
            </Link>
          </div>

          {/* Mobile Accordions */}
          <div className="space-y-3">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-primary mb-2">Shop Categories</p>
            {categoriesWithSubs.map((cat) => (
              <MobileCategoryAccordion
                key={cat._id}
                category={cat}
                onClose={() => setMobileOpen(false)}
              />
            ))}
          </div>

          {!isAuthenticated ? (
            <Link to="/login" onClick={() => setMobileOpen(false)} className="mt-2 rounded-2xl bg-white text-black px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-center shadow-2xl shadow-white/10">
              Join the Movement
            </Link>
          ) : (
            <div className="mt-2 pt-4 border-t border-white/10 space-y-3">
              <Link
                to={user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'seller' ? '/seller/dashboard' : '/profile'}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between w-full rounded-2xl bg-brand-primary px-6 py-4 text-xs font-black uppercase tracking-widest text-black shadow-xl"
              >
                <span>{user?.role === 'admin' ? 'Admin Access' : user?.role === 'seller' ? 'Vendor Access' : 'My Account'}</span>
                <LayoutDashboard className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </header>
  );
};
