import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../services/order.service.js';
import { Loader2, Package, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

const statusColors = {
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  confirmed: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
  shipped: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  delivered: 'bg-surface-50 text-app-text border-surface-100',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/20'
};

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyOrders();
        if (res?.success) setOrders(res.data?.orders || []);
      } catch {
        toast.error('Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-app-text/45" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-wider text-app-text">My Orders</h1>
        <p className="text-xs text-app-text/50">Track your purchase history and order details.</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-surface-200 bg-surface-50/20 p-12 text-center">
          <div className="h-16 w-16 bg-surface-50 rounded-full flex items-center justify-center text-app-text/45 mb-4 shadow-soft mx-auto">
            <Package className="h-8 w-8" />
          </div>
          <p className="text-sm font-bold text-app-text mb-1">No orders yet</p>
          <p className="text-xs text-app-text/45 mb-5">When you place an order, it'll show up here.</p>
          <Link
            to="/shop"
            className="inline-block rounded-full bg-brand-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-black hover:opacity-90 transition-all active:scale-95"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/orders/${order._id}`}
              className="block rounded-2xl border border-white/10 bg-surface-50/40 p-5 shadow-soft backdrop-blur-md hover:-translate-y-0.5 hover:shadow-md transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-bold text-app-text">{order.orderNumber}</p>
                  <p className="text-[10px] text-app-text/45 mt-1">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                    {' · '}
                    {order.items?.length || 0} item(s)
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      statusColors[order.status] || statusColors.confirmed
                    }`}
                  >
                    {order.status}
                  </span>
                  <span className="font-mono text-sm font-extrabold text-app-text">
                    ₹{order.total.toFixed(2)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-app-text/40" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
