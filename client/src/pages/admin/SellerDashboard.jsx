import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { getProducts } from '../../services/product.service.js';
import { getAllOrders } from '../../services/order.service.js';
import { TrendingUp, Package, ShoppingCart, DollarSign, ArrowUpRight, Loader2, Clock } from 'lucide-react';

export const SellerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    revenue: 0,
    activeCategories: 0
  });
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellerStats = async () => {
      if (!user?._id) return;
      try {
        const [prodRes, ordersRes] = await Promise.all([
          getProducts({ seller: user._id, limit: 1000 }),
          getAllOrders({ seller: user._id })
        ]);

        const products = prodRes.data?.products || [];
        const orders = ordersRes?.data || [];
        
        // Calculate revenue and product performance
        const productStats = {};
        let sellerRevenue = 0;

        orders.forEach(order => {
          const isRevenueOrder = ['confirmed', 'shipped', 'delivered'].includes(order.status);
          
          order.items.forEach(item => {
            const productMatch = products.find(p => String(p._id) === String(item.product?._id || item.product));
            if (productMatch) {
              const itemRevenue = (item.unitPrice * item.quantity);
              const productId = productMatch._id;

              if (isRevenueOrder) {
                sellerRevenue += itemRevenue;
              }

              if (!productStats[productId]) {
                productStats[productId] = { revenue: 0, units: 0, title: productMatch.title, image: productMatch.image };
              }
              
              if (isRevenueOrder) {
                productStats[productId].revenue += itemRevenue;
                productStats[productId].units += item.quantity;
              }
            }
          });
        });

        const sortedTopProducts = Object.values(productStats)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        const categories = new Set(products.map(p => p.category?._id));

        setStats({
          totalProducts: products.length,
          totalOrders: orders.length,
          revenue: sellerRevenue,
          activeCategories: categories.size
        });

        setTopProducts(sortedTopProducts);
        
        // Prepare recent orders for display
        setRecentOrders(orders.slice(0, 5).map(o => ({
          ...o,
          vendorSubtotal: o.items
            .filter(item => products.some(p => String(p._id) === String(item.product?._id || item.product)))
            .reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
        })));

      } catch (err) {
        console.error('Seller stats error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-app-text/40" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-wider text-app-text">Seller Command Center</h2>
        <p className="text-sm text-app-text/50">Performance overview for your specialized catalog.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-surface-100 p-6 rounded-3xl border border-border-base shadow-soft group hover:border-brand-primary/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Gross Revenue</p>
          <p className="text-2xl font-black text-app-text mt-1">₹{stats.revenue.toLocaleString('en-IN')}</p>
        </div>

        {/* Orders */}
        <div className="bg-surface-100 p-6 rounded-3xl border border-border-base shadow-soft group hover:border-brand-primary/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Total Orders</p>
          <p className="text-2xl font-black text-app-text mt-1">{stats.totalOrders}</p>
        </div>

        {/* Products */}
        <div className="bg-surface-100 p-6 rounded-3xl border border-border-base shadow-soft group hover:border-brand-primary/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Active Listings</p>
          <p className="text-2xl font-black text-app-text mt-1">{stats.totalProducts}</p>
        </div>

        {/* Categories */}
        <div className="bg-surface-100 p-6 rounded-3xl border border-border-base shadow-soft group hover:border-brand-primary/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Category Reach</p>
          <p className="text-2xl font-black text-app-text mt-1">{stats.activeCategories}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-surface-100 p-8 rounded-[40px] border border-border-base shadow-soft">
          <h3 className="text-lg font-black uppercase tracking-tighter text-app-text mb-6 flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-emerald-500" />
            Top Performing Products
          </h3>
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <img src={p.image} alt="" className="h-12 w-10 object-cover rounded-lg bg-surface-200 border border-border-base" />
                <div className="flex-1">
                  <p className="text-[11px] font-black uppercase tracking-tight text-app-text line-clamp-1 group-hover:text-brand-primary transition-colors">{p.title}</p>
                  <p className="text-[9px] font-bold text-muted uppercase">{p.units} Units Sold</p>
                </div>
                <p className="text-xs font-black text-emerald-600">₹{p.revenue.toLocaleString('en-IN')}</p>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div className="py-10 text-center text-xs font-bold text-muted uppercase italic">No sales data recorded</div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-surface-100 p-8 rounded-[40px] border border-border-base shadow-soft">
          <h3 className="text-lg font-black uppercase tracking-tighter text-app-text mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-primary" />
            Recent Orders
          </h3>
          <div className="space-y-4">
            {recentOrders.map((o) => (
              <div key={o._id} className="flex items-center justify-between border-b border-surface-200 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-[11px] font-black uppercase text-app-text">#{o.orderNumber}</p>
                  <p className="text-[9px] font-bold text-muted uppercase">{new Date(o.createdAt).toLocaleDateString()} • {o.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-app-text">₹{o.vendorSubtotal.toLocaleString('en-IN')}</p>
                  <p className="text-[9px] font-bold text-muted uppercase">{o.items.length} items</p>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <div className="py-10 text-center text-xs font-bold text-muted uppercase italic">No recent activity</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-app-text p-8 rounded-[40px] text-app-bg shadow-2xl">
          <h3 className="text-lg font-black uppercase tracking-tighter mb-2">Growth Milestone</h3>
          <p className="text-xs font-bold opacity-70 leading-relaxed mb-6">
            Keep adding premium products to increase visibility and reach your next sales target.
          </p>
          <div className="w-full h-2 bg-app-bg/20 rounded-full overflow-hidden">
            <div className="h-full bg-app-bg w-[65%] rounded-full" />
          </div>
        </div>

        <div className="bg-surface-100 p-8 rounded-[40px] border border-border-base flex flex-col justify-center shadow-soft">
          <h3 className="text-lg font-black uppercase tracking-tighter text-app-text mb-1">Seller Tip</h3>
          <p className="text-xs font-bold text-muted leading-relaxed">
            High-quality product images can increase conversion rates by up to 45%. Make sure your catalog shines.
          </p>
        </div>
      </div>
    </div>
  );
};
