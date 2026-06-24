import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getCategories, getAllOrders, getOrderAnalytics } from '../../services/api.js';
import StockHeatmap from '../../components/admin/StockHeatmap.jsx';
import RevenueAnalytics from '../../components/admin/RevenueAnalytics.jsx';
import { TrendingUp, Package, Download } from 'lucide-react';

/**
 * Admin Dashboard overview page with stats cards.
 */
export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalValue: 0,
    avgPrice: 0,
    totalOrders: 0,
    orderRevenue: 0,
    lowStock: 0,
    outOfStock: 0,
    stockLevels: [] // for the visual widget
  });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [prodRes, catRes, ordersRes, analyticsRes] = await Promise.all([
          getProducts({ page: 1, limit: 1000 }),
          getCategories(),
          getAllOrders().catch(() => ({ success: true, data: [] })),
          getOrderAnalytics().catch(() => ({ success: true, data: null }))
        ]);
        const products = prodRes.data?.products || [];
        const categories = catRes.data || [];
        const totalValue = products.reduce((sum, p) => sum + (p.discountedPrice > 0 ? p.discountedPrice : p.price), 0);
        const avgPrice = products.length > 0 ? totalValue / products.length : 0;

        const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
        const outOfStock = products.filter(p => p.stock === 0).length;

        const orders = ordersRes?.data || [];
        const orderRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

        setStats({
          totalProducts: prodRes.data?.pagination?.totalProducts || products.length,
          totalCategories: categories.length,
          totalValue,
          avgPrice,
          totalOrders: orders.length,
          orderRevenue,
          lowStock,
          outOfStock,
          stockLevels: products.map(p => ({ id: p._id, title: p.title, stock: p.stock || 0 })).slice(0, 10)
        });
        
        if (analyticsRes?.success) {
          setAnalytics(analyticsRes.data);
        }
      } catch (err) {
        console.error('Dashboard stats error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const formatCurrency = (val) => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const handleExportCSV = () => {
    // In a real app, you might fetch with Authorization header, 
    // but since we use cookies for auth, window.open works.
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v3/orders/export/csv`, '_blank');
  };
  
  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      
      {/* Header Actions */}
      <div className="flex justify-end">
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-brand-primary text-black px-5 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-colors"
        >
          <Download className="h-4 w-4" />
          Export Sales CSV
        </button>
      </div>

      {/* 1. Primary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-app-card p-8 rounded-[2.5rem] border border-border-base shadow-soft group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted mb-2 italic">Total Revenue</p>
          <div className="flex items-end justify-between relative z-10">
            <h3 className="text-4xl font-black text-app-text tracking-tighter italic">{formatCurrency(stats.orderRevenue)}</h3>
            <span className="text-[11px] font-black text-success flex items-center bg-success/10 px-4 py-1.5 rounded-full border border-success/20">
              <TrendingUp className="h-4 w-4 mr-2" /> +14.5%
            </span>
          </div>
        </div>

        <div className="bg-app-card p-8 rounded-[2.5rem] border border-border-base shadow-soft group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-cyan/5 rounded-full blur-3xl -mr-16 -mt-16" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted mb-2 italic">Processed Sales</p>
          <div className="flex items-end justify-between relative z-10">
            <h3 className="text-4xl font-black text-app-text tracking-tighter italic">{stats.totalOrders}</h3>
            <span className="text-[11px] font-black text-brand-primary flex items-center bg-brand-primary/10 px-4 py-1.5 rounded-full border border-brand-primary/20">
              <Package className="h-4 w-4 mr-2" /> Live Now
            </span>
          </div>
        </div>
      </div>

      {/* 2. Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Stock Heatmap Visualization */}
        <div className="lg:col-span-2">
          <StockHeatmap />
        </div>

        {/* Right: Valuation & Inventory Status */}
        <div className="space-y-8">
          <div className="bg-[#121212] p-8 rounded-[3rem] text-brand-primary shadow-soft relative overflow-hidden group border border-border-base">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/10 rounded-full blur-[60px] -mr-24 -mt-24 transition-all group-hover:scale-110" />
            <div className="relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 italic opacity-70">Inventory Valuation</h4>
              <div className="space-y-6">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-50 mb-1">Total Market Value</p>
                  <p className="text-4xl font-black italic tracking-tighter">{formatCurrency(stats.totalValue)}</p>
                </div>
                <div className="pt-6 border-t border-brand-primary/10">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-50 mb-1">Avg. SKU Performance</p>
                  <p className="text-2xl font-black italic tracking-tighter">{formatCurrency(stats.avgPrice)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-app-card p-8 rounded-[3rem] border border-border-base shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-app-text italic">Top Clusters</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-app-text/70">Clothing</span>
                <span className="text-[10px] font-black italic text-app-text">65%</span>
              </div>
              <div className="w-full bg-app-panel h-1 rounded-full overflow-hidden">
                <div className="bg-brand-primary h-full rounded-full w-[65%]" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-app-text/70">Footwear</span>
                <span className="text-[10px] font-black italic text-app-text">25%</span>
              </div>
              <div className="w-full bg-app-panel h-1 rounded-full overflow-hidden">
                <div className="bg-accent-cyan h-full rounded-full w-[25%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Revenue Analytics Section */}
      {analytics && <RevenueAnalytics data={analytics} />}

      {/* 4. Critical Alerts Row (Moved Down) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-app-card p-6 rounded-[2rem] border border-border-base shadow-soft flex items-center justify-between px-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-warning mb-1">Low Stock Warning</p>
            <h4 className="text-2xl font-black italic tracking-tighter text-app-text">{stats.lowStock} <span className="text-[10px] not-italic text-muted ml-2">SKUs remaining</span></h4>
          </div>
          <div className="h-12 w-32 bg-app-panel rounded-full overflow-hidden">
            <div className="bg-warning h-full transition-all duration-1000" style={{ width: `${Math.min((stats.lowStock/50)*100, 100)}%` }} />
          </div>
        </div>

        <div className="bg-app-card p-6 rounded-[2rem] border border-border-base shadow-soft flex items-center justify-between px-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-error mb-1">Out of Stock Critical</p>
            <h4 className="text-2xl font-black italic tracking-tighter text-app-text">{stats.outOfStock} <span className="text-[10px] not-italic text-muted ml-2">Items unavailable</span></h4>
          </div>
          <div className="h-12 w-32 bg-app-panel rounded-full overflow-hidden">
            <div className="bg-error h-full transition-all duration-1000" style={{ width: `${Math.min((stats.outOfStock/20)*100, 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};
