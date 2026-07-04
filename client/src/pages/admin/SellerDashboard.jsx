import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { getProducts } from '../../services/product.service.js';
import { getAllOrders } from '../../services/order.service.js';
import { TrendingUp, Package, ShoppingCart, DollarSign, ArrowUpRight, Loader2, Clock } from 'lucide-react';

const calculateSellerData = (products, orders) => {
  let revenue = 0;
  const productStats = {};

  orders.forEach(order => {
    const isRevenueOrder = ['confirmed', 'shipped', 'delivered'].includes(order.status);
    
    order.items.forEach(item => {
      const productMatch = products.find(p => String(p._id) === String(item.product?._id || item.product));
      if (!productMatch) return;

      const itemRevenue = item.unitPrice * item.quantity;
      if (isRevenueOrder) revenue += itemRevenue;

      const pid = productMatch._id;
      if (!productStats[pid]) {
        productStats[pid] = { revenue: 0, units: 0, title: productMatch.title, image: productMatch.image };
      }

      if (isRevenueOrder) {
        productStats[pid].revenue += itemRevenue;
        productStats[pid].units += item.quantity;
      }
    });
  });

  const topProducts = Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const categoriesCount = new Set(products.map(p => p.category?._id)).size;

  const recentOrders = orders.slice(0, 5).map(o => {
    const vendorSubtotal = o.items
      .filter(item => products.some(p => String(p._id) === String(item.product?._id || item.product)))
      .reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    return { ...o, vendorSubtotal };
  });

  return {
    totalProducts: products.length,
    totalOrders: orders.filter(o => o.status !== 'cancelled').length,
    revenue,
    activeCategories: categoriesCount,
    topProducts,
    recentOrders
  };
};

export const SellerDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    totalProducts: 0,
    totalOrders: 0,
    revenue: 0,
    activeCategories: 0,
    topProducts: [],
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) return;
      try {
        const [prodRes, ordersRes] = await Promise.all([
          getProducts({ seller: user._id, limit: 1000 }),
          getAllOrders({ seller: user._id })
        ]);

        const ordersData = ordersRes?.data;
        const orders = Array.isArray(ordersData) ? ordersData : (ordersData?.orders || []);

        const processedData = calculateSellerData(
          prodRes.data?.products || [],
          orders
        );

        setData(processedData);
      } catch (err) {
        console.error('Seller stats error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">


      {/* --- Stat Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Gross Revenue" 
          value={`₹${data.revenue.toLocaleString('en-IN')}`} 
          icon={<DollarSign className="h-7 w-7 text-brand-primary" />} 
          bg="bg-brand-primary/10"
        />
        <StatCard 
          title="Total Orders" 
          value={data.totalOrders} 
          icon={<ShoppingCart className="h-7 w-7 text-brand-primary" />} 
          bg="bg-brand-primary/10"
        />
        <StatCard 
          title="Active Listings" 
          value={data.totalProducts} 
          icon={<Package className="h-7 w-7 text-brand-primary" />} 
          bg="bg-brand-primary/10"
        />
        <StatCard 
          title="Category Reach" 
          value={data.activeCategories} 
          icon={<TrendingUp className="h-7 w-7 text-brand-primary" />} 
          bg="bg-brand-primary/10"
        />
      </div>

      {/* --- Main Content --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Products */}
        <div className="bg-surface-50/40 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <ArrowUpRight className="h-6 w-6 text-brand-primary" />
            Top Performing Products
          </h3>
          <div className="space-y-4">
            {data.topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-5 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <img src={p.image} alt={p.title} className="h-16 w-16 object-cover rounded-lg border border-white/10" />
                <div className="flex-1">
                  <p className="text-base font-semibold text-white line-clamp-1">{p.title}</p>
                  <p className="text-sm font-medium text-white/50 mt-1">{p.units} Units Sold</p>
                </div>
                <p className="text-lg font-bold text-brand-primary">₹{p.revenue.toLocaleString('en-IN')}</p>
              </div>
            ))}
            {data.topProducts.length === 0 && (
              <div className="py-8 text-center text-base text-white/40">No sales data recorded yet.</div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-surface-50/40 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <Clock className="h-6 w-6 text-brand-primary" />
            Recent Orders
          </h3>
          <div className="space-y-4">
            {data.recentOrders.map((o) => (
              <div key={o._id} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="text-base font-semibold text-white">Order #{o.orderNumber}</p>
                  <p className="text-sm font-medium text-white/50 mt-1">
                    {new Date(o.createdAt).toLocaleDateString()} &bull; <span className="capitalize">{o.status}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">₹{o.vendorSubtotal.toLocaleString('en-IN')}</p>
                  <p className="text-sm font-medium text-white/50 mt-1">{o.items.length} items</p>
                </div>
              </div>
            ))}
            {data.recentOrders.length === 0 && (
              <div className="py-8 text-center text-base text-white/40">No recent orders found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Reusable UI Components (KISS Principle) ---
const StatCard = ({ title, value, icon, bg }) => (
  <div className="bg-surface-50/40 p-6 rounded-2xl border border-white/10 backdrop-blur-md flex items-center gap-5">
    <div className={`p-4 rounded-xl ${bg}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-semibold text-white/50">{title}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  </div>
);
