import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrderById } from '../services/api.js';
import { Loader2, ArrowLeft, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { resolveImageUrl } from '../utils/helpers.js';

export const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getOrderById(id);
        if (res?.success) setOrder(res.data);
      } catch {
        toast.error('Failed to load order.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-app-text/45" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-app-text/50">Order not found.</p>
        <Link to="/orders" className="text-xs font-bold uppercase text-app-text underline mt-4 inline-block">
          Back to Orders
        </Link>
      </div>
    );
  }

  const addr = order.shippingAddress;

  return (
    <div className="space-y-8 pb-16">
      <Link
        to="/orders"
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-app-text/50 hover:text-app-text"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Orders
      </Link>

      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-app-text font-mono">
            {order.orderNumber}
          </h1>
          <p className="text-xs text-app-text/50 mt-1">
            Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 h-fit">
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl border border-white/60 bg-surface-50/40 overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/30 text-[10px] font-bold uppercase tracking-wider text-app-text/45">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4 text-center">Qty</th>
                <th className="px-6 py-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100/40">
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveImageUrl(item.image)}
                        alt={item.title}
                        className="w-12 h-12 rounded-lg object-cover border border-white"
                      />
                      <span className="font-bold uppercase text-[11px]">{item.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-mono">{item.quantity}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold">
                    ₹{item.subtotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/60 bg-surface-50/40 p-5 shadow-soft space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-[10px] text-app-text">Order Summary</h3>
            <div className="flex justify-between text-app-text/60">
              <span>Subtotal</span>
              <span className="font-mono font-bold">₹{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                <span className="font-mono font-bold">- ₹{order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {order.taxAmount > 0 && (
              <div className="flex justify-between text-app-text/60">
                <span>Taxes (GST 18%)</span>
                <span className="font-mono font-bold">₹{order.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-app-text pt-2 border-t border-surface-100">
              <span className="uppercase text-[10px]">Total</span>
              <span className="font-mono">₹{order.total.toFixed(2)}</span>
            </div>
            <p className="text-[9px] text-app-text/40 uppercase">
              Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Demo'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/60 bg-surface-50/40 p-5 shadow-soft text-xs">
            <h3 className="font-bold uppercase tracking-wider text-[10px] text-app-text flex items-center gap-1.5 mb-3">
              <MapPin className="h-3.5 w-3.5" />
              Shipping Address
            </h3>
            <p className="font-semibold text-app-text">{addr.fullName}</p>
            <p className="text-app-text/60 mt-1 leading-relaxed">
              {addr.street}, {addr.city}, {addr.state} {addr.zipCode}
              <br />
              {addr.country} · {addr.phone}
            </p>
          </div>

          {/* Order Tracking Timeline */}
          <div className="rounded-2xl border border-white/60 bg-surface-50/40 p-5 shadow-soft">
            <h3 className="font-bold uppercase tracking-wider text-[10px] text-app-text mb-4">Order Status</h3>
            {order.status === 'cancelled' ? (
              <div className="text-red-500 font-black text-xs uppercase tracking-widest py-2">
                Order Cancelled
              </div>
            ) : (
              <div className="relative space-y-6">
                <div className="absolute left-[11px] top-3 bottom-3 w-px bg-surface-200" />
                {['pending', 'processing', 'shipped', 'delivered'].map((stage, idx) => {
                  const currentIndex = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status);
                  const isCompleted = idx <= currentIndex;
                  const isCurrent = idx === currentIndex;
                  
                  return (
                    <div key={stage} className="relative flex items-start gap-4">
                      <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-surface-50 ${
                        isCompleted ? 'border-brand-primary bg-brand-primary/20' : 'border-surface-200'
                      }`}>
                        {isCompleted && <div className="h-2 w-2 rounded-full bg-brand-primary" />}
                      </div>
                      <div className="pt-0.5">
                        <p className={`text-[11px] font-black uppercase tracking-widest ${
                          isCompleted ? 'text-app-text' : 'text-app-text/40'
                        }`}>
                          {stage}
                        </p>
                        {isCurrent && (
                          <p className="text-[9px] font-bold text-app-text/50 uppercase tracking-widest mt-1">
                            {stage === 'pending' && 'Order placed successfully'}
                            {stage === 'processing' && 'Preparing your items'}
                            {stage === 'shipped' && 'Handed over to delivery partner'}
                            {stage === 'delivered' && 'Package delivered'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
