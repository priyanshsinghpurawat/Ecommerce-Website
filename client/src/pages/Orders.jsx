import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../services/order.service.js';
import { Loader2, Package, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

const statusColors = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  shipped: 'bg-blue-50 text-blue-700 border-blue-100',
  delivered: 'bg-surface-50 text-app-text border-surface-100',
  cancelled: 'bg-red-50 text-red-600 border-red-100'
};

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyOrders();
        if (res?.success) setOrders(res.data || []);
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
          <Package className="h-10 w-10 mx-auto text-app-text/30 mb-4" />
          <p className="text-xs text-app-text/50 mb-4">You have not placed any orders yet.</p>
          <Link
            to="/shop"
            className="inline-block rounded-2xl bg-app-text px-6 py-3 text-xs font-bold uppercase tracking-wider text-black hover:bg-app-text-hover"
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
              className="block rounded-2xl border border-white/60 bg-surface-50/40 p-5 shadow-soft backdrop-blur-md hover:-translate-y-0.5 hover:shadow-md transition-all"
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
