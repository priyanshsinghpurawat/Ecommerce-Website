import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrderById } from '../services/order.service.js';
import { Loader2, ArrowLeft, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { resolveImageUrl } from '../utils/imageUrl.js';

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
        <Loader2 className="h-8 w-8 animate-spin text-lux-dark/45" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-lux-dark/50">Order not found.</p>
        <Link to="/orders" className="text-xs font-bold uppercase text-lux-dark underline mt-4 inline-block">
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
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-lux-dark/50 hover:text-lux-dark"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Orders
      </Link>

      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-lux-dark font-mono">
            {order.orderNumber}
          </h1>
          <p className="text-xs text-lux-dark/50 mt-1">
            Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 h-fit">
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl border border-white/60 bg-lux-50/40 overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-lux-100 bg-lux-50/30 text-[10px] font-bold uppercase tracking-wider text-lux-dark/45">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4 text-center">Qty</th>
                <th className="px-6 py-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lux-100/40">
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
          <div className="rounded-2xl border border-white/60 bg-lux-50/40 p-5 shadow-soft space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-[10px] text-lux-dark">Order Summary</h3>
            <div className="flex justify-between text-lux-dark/60">
              <span>Subtotal</span>
              <span className="font-mono font-bold">₹{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                <span className="font-mono font-bold">- ₹{order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-lux-dark pt-2 border-t border-lux-100">
              <span className="uppercase text-[10px]">Total</span>
              <span className="font-mono">₹{order.total.toFixed(2)}</span>
            </div>
            <p className="text-[9px] text-lux-dark/40 uppercase">
              Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Demo'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/60 bg-lux-50/40 p-5 shadow-soft text-xs">
            <h3 className="font-bold uppercase tracking-wider text-[10px] text-lux-dark flex items-center gap-1.5 mb-3">
              <MapPin className="h-3.5 w-3.5" />
              Shipping Address
            </h3>
            <p className="font-semibold text-lux-dark">{addr.fullName}</p>
            <p className="text-lux-dark/60 mt-1 leading-relaxed">
              {addr.street}, {addr.city}, {addr.state} {addr.zipCode}
              <br />
              {addr.country} · {addr.phone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
