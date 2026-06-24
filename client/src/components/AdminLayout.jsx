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
import { Logo } from './Logo.jsx';

export const AdminLayout = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const navLinks = [
    { to: '/admin/dashboard', label: 'Command Hub', icon: LayoutDashboard },
    { to: '/admin/products', label: 'Inventory Control', icon: ShoppingBag },
    { to: '/admin/categories', label: 'Taxonomy', icon: Tags },
    { to: '/admin/subcategories', label: 'Hierarchy', icon: Layers },
    { to: '/admin/coupons', label: 'Growth Engines', icon: Ticket },
    { to: '/admin/orders', label: 'Fulfillment', icon: ClipboardList },
    { to: '/admin/users', label: 'Access Control', icon: Users },
    { to: '/admin/vendors', label: 'Market Partners', icon: Store },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0b] text-white font-sans overflow-hidden">
      
      {/* Sidebar - Desktop (The Command Panel) */}
      <aside className="hidden md:flex md:w-[280px] flex-col bg-[#121214] border-r border-white/5 shadow-2xl relative z-50">
        {/* Brand / Logo */}
        <div className="h-[80px] flex items-center px-8 border-b border-white/5 bg-[#121214]/50 backdrop-blur-xl">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative group-hover:scale-110 transition-transform">
              <Logo className="h-10 w-10" />
              <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#121214] animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-[0.2em] text-white uppercase leading-none">
                Command
              </span>
              <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] mt-1">
                Centre
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto scrollbar-hide">
          <p className="px-4 mb-4 text-[9px] font-black uppercase tracking-[0.4em] text-white/20">System Management</p>
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 relative group overflow-hidden ${
                    isActive
                      ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-[inset_0_0_20px_rgba(193,255,0,0.05)]'
                      : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110" />
                    {link.label}
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-brand-primary rounded-l-full shadow-[0_0_10px_rgba(193,255,0,0.5)]" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Info & Logout (Bottom) */}
        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 border border-brand-primary/20">
                <User className="h-5 w-5 text-brand-primary" />
              </div>
            </div>
            <div className="truncate flex-1">
              <p className="text-[11px] font-black italic text-white truncate uppercase tracking-tight">{user?.name || 'Root Admin'}</p>
              <p className="text-[9px] text-white/30 truncate font-black tracking-widest uppercase">{user?.email || 'System Auth OK'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
              title="Terminate Session"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header (The Terminal Header) */}
        <header className="h-[80px] flex items-center justify-between px-10 bg-[#121214]/50 backdrop-blur-xl border-b border-white/5 z-40">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-white/60 hover:bg-white/5 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
                <h1 className="text-sm font-black uppercase tracking-[0.3em] text-white italic">
                  Operational <span className="text-brand-primary">Status</span>
                </h1>
              </div>
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">Global Terminal V.4.0.2</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {/* Real-time Stats Mockup */}
            <div className="hidden lg:flex items-center gap-6 border-r border-white/5 pr-8">
              <div className="text-right">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Server Load</p>
                <p className="text-xs font-black text-brand-primary tracking-tighter">12.4% <span className="text-[9px] text-white/20 italic">NOMINAL</span></p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Active Fulfilment</p>
                <p className="text-xs font-black text-white tracking-tighter">182 <span className="text-[9px] text-emerald-500">LIVE</span></p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/40 hover:text-brand-primary transition-colors border border-white/5">
                <Search className="h-4 w-4" />
              </button>
              <button className="relative h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/40 hover:text-brand-primary transition-colors border border-white/5">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-brand-primary ring-4 ring-[#121214]"></span>
              </button>
              
              <Link
                to="/admin/products"
                className="hidden sm:flex items-center gap-3 px-6 py-2.5 bg-brand-primary text-black rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-90 hover:scale-105 transition-all shadow-[0_10px_30px_rgba(193,255,0,0.15)]"
              >
                <Plus className="h-3.5 w-3.5" />
                Launch Resource
              </Link>
            </div>
          </div>
        </header>

        {/* Main Dashboard Space */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0a0a0b] p-8 custom-scrollbar relative">
          {/* Subtle Ambient Page Glows */}
          <div className="absolute top-[5%] right-[-150px] w-[650px] h-[650px] rounded-full bg-brand-primary/8 blur-[140px] pointer-events-none z-0 opacity-75" />
          <div className="absolute bottom-[-50px] left-[-200px] w-[750px] h-[750px] rounded-full bg-accent-cyan/6 blur-[160px] pointer-events-none z-0 opacity-60" />

          <div className="max-w-[1400px] mx-auto animate-in fade-in zoom-in-95 duration-500 relative z-10">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative flex flex-col w-80 h-full bg-[#121214] border-r border-white/5 shadow-2xl transition-all duration-300 animate-in slide-in-from-left">
            <div className="h-[80px] flex items-center justify-between px-8 border-b border-white/5">
              <span className="text-xs font-black uppercase tracking-[0.3em] text-white">
                Mens<span className="italic text-brand-primary">Vibe</span> Admin
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl hover:bg-white/5 text-white/40 transition-all"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                        isActive
                          ? 'bg-brand-primary text-black shadow-lg shadow-brand-primary/20'
                          : 'text-white/40 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </NavLink>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

    </div>
  );
};
