import React, { useEffect, useState, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { User, LogOut, LayoutDashboard, ShoppingBag, Package, Search, Menu, X, Heart, Moon, Sun, ChevronDown, Zap, Loader2 } from 'lucide-react';
import { useCart } from '../hooks/useCart.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { getSubcategories } from '../services/subcategory.service.js';
import { getProducts } from '../services/product.service.js';
import { resolveImageUrl } from '../utils/imageUrl.js';
import { FEATURED_SUBCATEGORY_NAMES } from '../constants/showcase.js';

/**
 * NAVBAR COMPONENT
 * 
 * This is the main navigation bar. It handles:
 * 1. Global Navigation (Shop, Street Drip, Subcategories)
 * 2. Search functionality with debounced autosuggest
 * 3. User Authentication state (Login, Profile, Logout)
 * 4. Theme switching (Dark/Light)
 * 5. Cart & Wishlist counters
 */
export const Navbar = () => {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const { cartItemsCount } = useCart();
  const { wishlist } = useWishlist();
  const { theme, toggleTheme } = useTheme();
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

  // Fetch subcategories once when component loads
  useEffect(() => {
    getSubcategories()
      .then((res) => setSubcategories(res?.data || []))
      .catch(() => setSubcategories([]));
  }, []);

  // Handle clicking outside the user profile dropdown or search dropdown to close it
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

  // Filter out the 'Featured' subcategories for the main nav links
  const navSubs = FEATURED_SUBCATEGORY_NAMES.map((name) =>
    subcategories.find((s) => s.name === name)
  ).filter(Boolean);

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
    navigate(`/products/${productId}`);
    setSearchOpen(false);
    setSuggestions([]);
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-50 glass shadow-nav transition-all duration-300">
      <div className="border-b border-lux-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
          
          {/* 1. LOGO */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-md gradient-primary text-xs font-black text-black group-hover:scale-110 transition-transform">
              M
            </span>
            <span className="text-sm font-black tracking-tight text-lux-dark uppercase">
              Mens<span className="italic text-lux-primary group-hover:text-lux-accent-cyan transition-colors">Vibe</span>
            </span>
          </Link>

          {/* 2. MAIN NAVIGATION (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center overflow-x-auto no-scrollbar">
            {/* If Search is open, show the bar, but keep it condensed to not hide all links */}
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
                      className="w-full rounded-full border border-lux-200 bg-lux-50 px-4 py-1.5 pl-10 pr-10 text-xs focus:outline-none focus:border-lux-primary transition-all shadow-inner"
                    />
                    <Search className="absolute left-3.5 top-2 h-3.5 w-3.5 text-lux-dark/45" />
                    
                    {searching ? (
                      <Loader2 className="absolute right-10 top-2 h-3.5 w-3.5 animate-spin text-lux-dark/45" />
                    ) : null}

                    <button
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        setSuggestions([]);
                        setSearchQuery('');
                      }}
                      className="absolute right-3 top-2 text-lux-dark/30 hover:text-lux-dark"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </form>

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden z-50 py-2 divide-y divide-white/5">
                    <div className="px-4 py-1.5 text-[8px] font-black uppercase tracking-wider text-lux-primary">
                      Matching Products
                    </div>
                    {suggestions.map((product) => (
                      <button
                        key={product._id}
                        onClick={() => handleSuggestionClick(product._id)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-left transition-colors"
                      >
                        <img
                          src={resolveImageUrl(product.images?.[0] || product.image)}
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
                          <p className="text-[10px] font-black text-lux-primary">
                            ₹{product.discountedPrice > 0 ? product.discountedPrice : product.price}
                          </p>
                          {product.discountedPrice > 0 && (
                            <p className="text-[8px] font-bold text-white/35 line-through">
                              ₹{product.price}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full text-center py-2 text-[9px] font-black uppercase tracking-widest text-lux-primary hover:bg-white/5 transition-colors"
                    >
                      View all results
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <NavLink to="/shop" className={({ isActive }) => `px-3 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${isActive ? 'text-lux-primary underline underline-offset-4' : 'text-lux-dark/55 hover:text-lux-dark'}`}>
                  Shop
                </NavLink>
                
                {/* NEW OPTION: Street Drip */}
                <NavLink to="/street-drip" className={({ isActive }) => `px-3 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-1 ${isActive ? 'text-lux-accent-purple underline underline-offset-4' : 'text-lux-dark/55 hover:text-lux-accent-purple'}`}>
                  <Zap className="h-3 w-3" />
                  Street Drip
                </NavLink>

                {/* Subcategory Links */}
                {navSubs.map((sub) => (
                  <NavLink
                    key={sub._id}
                    to={`/shop?subcategory=${sub._id}`}
                    className={({ isActive }) =>
                      `px-3 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                        isActive ? 'text-lux-primary font-black' : 'text-lux-dark/55 hover:text-lux-dark'
                      }`
                    }
                  >
                    {sub.name}
                  </NavLink>
                ))}
              </div>
            )}
          </nav>

          {/* 3. ACTION ICONS (Search, Cart, Profile) */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {!searchOpen && (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg text-lux-dark/60 hover:bg-lux-50 hover:text-lux-dark transition-all"
                title="Search shop"
              >
                <Search className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-lux-dark/60 hover:bg-lux-50 hover:text-lux-dark transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link to="/wishlist" className="relative p-2 rounded-lg text-lux-dark/60 hover:bg-lux-50 hidden sm:block">
              <Heart className="h-4 w-4" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-white animate-bounce">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative p-2 rounded-lg text-lux-dark/60 hover:bg-lux-50">
              <ShoppingBag className="h-4 w-4" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-lux-primary text-[8px] font-bold text-white ring-2 ring-white animate-bounce">
                  {cartItemsCount > 9 ? '9+' : cartItemsCount}
                </span>
              )}
            </Link>

            {/* AUTH SECTION */}
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 bg-lux-dark/5 border border-lux-100 hover:bg-lux-dark/10 transition-all active:scale-95"
                >
                  <div className="h-7 w-7 rounded-full bg-lux-dark text-lux-primary flex items-center justify-center overflow-hidden border border-white/10">
                    {user?.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : <User className="h-3.5 w-3.5" />}
                  </div>
                  <ChevronDown className={`h-3 w-3 text-lux-dark/40 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 origin-top-right rounded-3xl bg-black/90 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-5 py-4 border-b border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-lux-primary">Signed in as</p>
                      <p className="text-xs font-bold text-white truncate mt-0.5">{user?.name}</p>
                    </div>
                    
                    <div className="p-2">
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-lux-primary hover:bg-white/5 rounded-2xl transition-all">
                        <User className="h-3.5 w-3.5" /> Account Details
                      </Link>
                      <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-lux-primary hover:bg-white/5 rounded-2xl transition-all">
                        <Package className="h-3.5 w-3.5" /> Purchase History
                      </Link>

                      {/* Admin/Seller Only Links */}
                      {(user?.role === 'admin' || user?.role === 'seller') && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <Link
                            to={user.role === 'admin' ? '/admin/dashboard' : '/seller/dashboard'}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-lux-primary hover:bg-lux-primary hover:text-black rounded-2xl transition-all shadow-lg shadow-lux-primary/5"
                          >
                            <LayoutDashboard className="h-3.5 w-3.5" />
                            {user.role === 'admin' ? 'Admin Console' : 'Vendor Station'}
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="p-2 border-t border-white/5 bg-white/5">
                      <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors">
                        <LogOut className="h-3.5 w-3.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="hidden sm:flex items-center gap-2 rounded-xl bg-lux-dark px-5 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-lux-bg hover:bg-lux-primary hover:text-black transition-all shadow-xl">
                Enter Vibe
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button type="button" className="lg:hidden p-2 text-lux-dark" onClick={() => setMobileOpen((o) => !o)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="lg:hidden border-b border-lux-100 bg-black/95 backdrop-blur-3xl px-4 py-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-wrap gap-2">
            <Link to="/shop" onClick={() => setMobileOpen(false)} className="rounded-xl bg-lux-primary px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-black shadow-xl">
              Catalog
            </Link>
            <Link to="/street-drip" onClick={() => setMobileOpen(false)} className="rounded-xl bg-lux-accent-purple px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
              Street Drip
            </Link>
            {navSubs.map((sub) => (
              <Link
                key={sub._id}
                to={`/shop?subcategory=${sub._id}`}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white/80"
              >
                {sub.name}
              </Link>
            ))}
          </div>
          
          {!isAuthenticated ? (
            <Link to="/login" onClick={() => setMobileOpen(false)} className="mt-2 rounded-2xl bg-white text-black px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-center shadow-2xl shadow-white/10">
              Join the Movement
            </Link>
          ) : (
            <div className="mt-4 pt-6 border-t border-white/10 space-y-3">
               <Link
                to={user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'seller' ? '/seller/dashboard' : '/profile'}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between w-full rounded-2xl bg-lux-primary px-6 py-4 text-xs font-black uppercase tracking-widest text-black shadow-xl"
              >
                <span>{user?.role === 'admin' ? 'Admin Access' : user?.role === 'seller' ? 'Vendor Access' : 'My Account'}</span>
                <LayoutDashboard className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
