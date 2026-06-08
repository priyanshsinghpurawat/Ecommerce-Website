import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Tags, 
  Layers,
  Ticket,
  ClipboardList,
  Store,
  LogOut, 
  User, 
  Menu, 
  X,
  Search,
  Bell,
  ChevronDown,
  Plus,
  Users
} from 'lucide-react';

export const AdminLayout = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const navLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/products', label: 'Products', icon: ShoppingBag },
    { to: '/admin/categories', label: 'Categories', icon: Tags },
    { to: '/admin/subcategories', label: 'Subcategories', icon: Layers },
    { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
    { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/vendors', label: 'Vendors', icon: Store },
  ];

  return (
    <div className="flex h-screen bg-lux-50/30 text-lux-dark font-sans overflow-hidden">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-[260px] flex-col bg-lux-100 text-lux-dark border-r border-border-base shadow-soft">
        {/* Brand / Logo */}
        <div className="h-[72px] flex items-center px-6 border-b border-border-base">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-md gradient-primary text-xs font-black text-black group-hover:scale-110 transition-transform">
              M
            </span>
            <span className="text-sm font-black tracking-tight text-lux-dark uppercase">
              Mens<span className="italic text-lux-primary group-hover:text-lux-accent-cyan transition-colors">Vibe</span>
            </span>
          </Link>
        </div>

        {/* Navigation Links */}
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
                      ? 'bg-lux-primary text-black shadow-md'
                      : 'text-muted hover:bg-lux-200 hover:text-lux-dark'
                  }`
                }
              >
                <Icon className="h-[18px] w-[18px]" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User Info & Logout (Bottom) */}
        <div className="p-4 border-t border-border-base bg-lux-dark/5">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lux-200 border border-border-base">
              <User className="h-5 w-5 text-muted" />
            </div>
            <div className="truncate flex-1">
              <p className="text-sm font-black italic text-lux-dark truncate uppercase tracking-tighter">{user?.name || 'Admin User'}</p>
              <p className="text-[10px] text-muted truncate font-bold">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-muted hover:text-error transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-lux-bg">
        
        {/* Header */}
        <header className="h-[72px] flex items-center justify-between px-8 bg-lux-bg border-b border-border-base z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-lux-dark/60 hover:bg-lux-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-black uppercase tracking-tighter text-lux-dark hidden md:block italic">
              Admin <span className="text-lux-primary">Control</span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-muted">
              <button className="hover:text-lux-primary transition-colors">
                <Search className="h-4 w-4" />
              </button>
              <button className="relative hover:text-lux-primary transition-colors">
                <Bell className="h-4 w-4" />
                <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-lux-primary ring-2 ring-lux-bg"></span>
              </button>
            </div>
            
            <Link
              to="/admin/products"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-lux-dark text-lux-bg rounded-xl font-black text-[10px] uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-lux-dark/10"
            >
              <Plus className="h-3.5 w-3.5" />
              Inventory
            </Link>
          </div>
        </header>

        {/* Nested Route Pages Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Sidebar - Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-lux-bg/40 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer Panel */}
          <aside className="relative flex flex-col w-72 max-w-xs h-full bg-lux-100 shadow-2xl transition-all duration-300 animate-in slide-in-from-left">
            <div className="h-[72px] flex items-center justify-between px-6 border-b border-border-base">
              <span className="text-sm font-black uppercase tracking-widest text-lux-dark">
                Mens<span className="italic text-lux-primary">Vibe</span> Admin
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl hover:bg-lux-200 text-muted hover:text-lux-dark transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                        isActive
                          ? 'bg-lux-primary text-black shadow-md'
                          : 'text-muted hover:bg-lux-200 hover:text-lux-dark'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-4 border-t border-border-base bg-lux-dark/5">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lux-200 text-lux-dark">
                  <User className="h-4 w-4" />
                </div>
                <div className="truncate flex-1">
                  <p className="text-xs font-black italic text-lux-dark">{user?.name || 'Admin User'}</p>
                  <p className="text-[10px] text-muted truncate">{user?.email || 'admin@mensvibe.in'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-error/20 bg-error/10 py-3 text-xs font-black uppercase tracking-widest text-error hover:bg-error hover:text-black transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

    </div>
  );
};
