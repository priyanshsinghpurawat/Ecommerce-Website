import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  LogOut, 
  User, 
  Menu, 
  X,
  Plus,
  ClipboardList,
  Wallet,
  Link2,
  Tag,
  Store
} from 'lucide-react';
import { Logo } from './Logo.jsx';

export const SellerLayout = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const navLinks = [
    { to: '/seller/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/seller/products', label: 'My Products', icon: ShoppingBag },
    { to: '/seller/orders', label: 'Store Orders', icon: ClipboardList },
    { to: '/seller/billing', label: 'Billing & Payouts', icon: Wallet },
    { to: '/seller/affiliates', label: 'Affiliates', icon: Link2 },
    { to: '/seller/coupons', label: 'My Coupons', icon: Tag },
    { to: '/seller/storefront', label: 'Branding', icon: Store },
  ];

  return (
    <div className="flex h-screen bg-app-bg text-app-text font-sans overflow-hidden">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-[260px] flex-col bg-surface-100 text-app-text border-r border-border-base shadow-soft">
        <div className="h-[72px] flex items-center px-6 border-b border-border-base">
          <Link to="/" className="flex items-center gap-2 group">
            <Logo className="h-8 w-8" />
            <span className="text-sm font-black tracking-tight text-app-text uppercase">
              Mens<span className="italic text-brand-primary">Vibe</span> <span className="text-[9px] bg-brand-primary text-black px-1.5 py-0.5 rounded-full ml-1 font-black">SELLER</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold tracking-tight uppercase transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-primary text-black shadow-md'
                      : 'text-muted hover:bg-surface-200 hover:text-app-text'
                  }`
                }
              >
                <Icon className="h-[18px] w-[18px]" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-base bg-app-text/5">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-200 border border-border-base">
              <User className="h-5 w-5 text-muted" />
            </div>
            <div className="truncate flex-1">
              <p className="text-sm font-black italic text-app-text truncate uppercase tracking-tighter">{user?.name || 'Seller User'}</p>
              <p className="text-[10px] text-muted truncate font-bold">Partner Seller</p>
            </div>
            <button onClick={handleLogout} className="p-2 text-muted hover:text-error transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-app-bg">
        <header className="h-[72px] flex items-center justify-between px-8 bg-app-bg border-b border-border-base z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 rounded-xl text-muted hover:bg-surface-100">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-black uppercase tracking-widest text-app-text italic hidden md:block">
              Seller <span className="text-brand-primary">Control</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
             <Link to="/seller/products" className="flex items-center gap-2 px-4 py-2 bg-app-text text-app-bg rounded-xl font-black text-[10px] uppercase tracking-wider hover:opacity-90 transition-all shadow-lg">
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
         <div className="fixed inset-0 z-50 md:hidden">
            <div className="fixed inset-0 bg-app-bg/40 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)} />
            <aside className="relative flex flex-col w-72 max-w-xs h-full bg-surface-100 shadow-2xl transition-all duration-300 animate-in slide-in-from-left">
               <div className="h-[72px] flex items-center justify-between px-6 border-b border-border-base">
                  <span className="text-sm font-black uppercase tracking-widest text-app-text">
                    Mens<span className="italic text-brand-primary">Vibe</span> Seller
                  </span>
                  <button onClick={() => setMobileMenuOpen(false)}><X className="h-5 w-5 text-muted hover:text-app-text" /></button>
               </div>
               <nav className="flex-1 px-4 py-6 space-y-1.5">
                  {navLinks.map((link) => (
                    <NavLink key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isActive ? 'bg-brand-primary text-black shadow-md' : 'text-muted hover:bg-surface-200 hover:text-app-text'}`}>
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </NavLink>
                  ))}
               </nav>
            </aside>
         </div>
      )}
    </div>
  );
};
