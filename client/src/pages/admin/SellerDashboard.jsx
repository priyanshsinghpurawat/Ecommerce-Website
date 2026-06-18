import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { getProducts, getAllOrders } from '../../services/api.js';
import { TrendingUp, Package, ShoppingCart, DollarSign, ArrowUpRight, Loader2, Clock } from 'lucide-react';

// --- Pure Helper Functions (KISS Principle) ---
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

        const processedData = calculateSellerData(
          prodRes.data?.products || [],
          ordersRes?.data || []
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
        <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Seller Dashboard</h2>
        <p className="text-base text-gray-600 mt-2">Manage your products and view your sales performance.</p>
      </div>

      {/* --- Stat Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Gross Revenue" 
          value={`₹${data.revenue.toLocaleString('en-IN')}`} 
          icon={<DollarSign className="h-7 w-7 text-emerald-600" />} 
          bg="bg-emerald-100"
        />
        <StatCard 
          title="Total Orders" 
          value={data.totalOrders} 
          icon={<ShoppingCart className="h-7 w-7 text-blue-600" />} 
          bg="bg-blue-100"
        />
        <StatCard 
          title="Active Listings" 
          value={data.totalProducts} 
          icon={<Package className="h-7 w-7 text-purple-600" />} 
          bg="bg-purple-100"
        />
        <StatCard 
          title="Category Reach" 
          value={data.activeCategories} 
          icon={<TrendingUp className="h-7 w-7 text-amber-600" />} 
          bg="bg-amber-100"
        />
      </div>

      {/* --- Main Content --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Products */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <ArrowUpRight className="h-6 w-6 text-emerald-600" />
            Top Performing Products
          </h3>
          <div className="space-y-4">
            {data.topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-5 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <img src={p.image} alt={p.title} className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900 line-clamp-1">{p.title}</p>
                  <p className="text-sm font-medium text-gray-500 mt-1">{p.units} Units Sold</p>
                </div>
                <p className="text-lg font-bold text-emerald-600">₹{p.revenue.toLocaleString('en-IN')}</p>
              </div>
            ))}
            {data.topProducts.length === 0 && (
              <div className="py-8 text-center text-base text-gray-500">No sales data recorded yet.</div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Clock className="h-6 w-6 text-blue-600" />
            Recent Orders
          </h3>
          <div className="space-y-4">
            {data.recentOrders.map((o) => (
              <div key={o._id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="text-base font-semibold text-gray-900">Order #{o.orderNumber}</p>
                  <p className="text-sm font-medium text-gray-500 mt-1">
                    {new Date(o.createdAt).toLocaleDateString()} &bull; <span className="capitalize">{o.status}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">₹{o.vendorSubtotal.toLocaleString('en-IN')}</p>
                  <p className="text-sm font-medium text-gray-500 mt-1">{o.items.length} items</p>
                </div>
              </div>
            ))}
            {data.recentOrders.length === 0 && (
              <div className="py-8 text-center text-base text-gray-500">No recent orders found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Reusable UI Components (KISS Principle) ---
const StatCard = ({ title, value, icon, bg }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-5">
    <div className={`p-4 rounded-xl ${bg}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-semibold text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  </div>
);
