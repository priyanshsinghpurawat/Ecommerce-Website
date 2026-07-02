import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrderById } from '../services/order.service.js';
import { Loader2, ArrowLeft, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { resolveImageUrl } from '../utils/helpers.js';

export const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use a ref to keep track of the latest order state without triggering effect re-runs
  const orderRef = useRef(order);

  // Sync ref whenever order changes
  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  useEffect(() => {
    let active = true;
    const load = async (showLoader = true) => {
      if (showLoader) setLoading(true);
      try {
        const res = await getOrderById(id);
        if (active && res?.success) setOrder(res.data);
      } catch {
        if (showLoader) toast.error('Failed to load order.');
      } finally {
        if (showLoader) setLoading(false);
      }
    };
    
    load(true);

    const TERMINAL_STATES = ['delivered', 'cancelled'];

    const intervalId = setInterval(() => {
      // Always read the latest order state from the ref to avoid stale closures
      const currentOrder = orderRef.current;
      if (currentOrder && TERMINAL_STATES.includes(currentOrder.status)) {
        clearInterval(intervalId);
        return;
      }
      load(false);
    }, 5000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
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
        {(() => {
          const STATUS_CLASSES = {
            pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
            confirmed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
            partially_shipped: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
            shipped: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
            delivered: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
            cancelled: 'bg-red-500/15 text-red-400 border-red-500/20'
          };
          const cls = STATUS_CLASSES[order.status] || 'bg-surface-50 text-app-text/70 border-surface-200';
          return (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border h-fit ${cls}`}>
              {order.status}
            </span>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-surface-50/40 overflow-hidden shadow-soft">
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
                <tr key={item._id || idx}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveImageUrl(item.image)}
                        alt={item.title}
                        className="w-12 h-12 rounded-lg object-cover border border-white"
                      />
                      <div>
                        <span className="font-bold uppercase text-[11px] block">{item.title}</span>
                        {item.status && (
                          <span className="inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-surface-200 text-app-text/70 mt-1">
                            {item.status}
                          </span>
                        )}
                      </div>
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
          <div className="rounded-2xl border border-white/10 bg-surface-50/40 p-5 shadow-soft space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-[10px] text-app-text">Order Summary</h3>
            <div className="flex justify-between text-app-text/60">
              <span>Subtotal</span>
              <span className="font-mono font-bold">₹{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-brand-primary">
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
              Payment: {(() => {
                const METHOD_LABELS = { cod: 'Cash on Delivery', razorpay: 'Razorpay / Prepaid', demo: 'Demo Payment' };
                return METHOD_LABELS[order.paymentMethod] || order.paymentMethod;
              })()}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-surface-50/40 p-5 shadow-soft text-xs">
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
          <div className="rounded-2xl border border-white/10 bg-surface-50/40 p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold uppercase tracking-wider text-[10px] text-app-text">Order Status</h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-primary/10 border border-brand-primary/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-primary"></span>
                </span>
                <span className="text-[8px] font-black text-brand-primary uppercase tracking-widest">Live Sync</span>
              </div>
            </div>
            {order.status === 'cancelled' ? (
              <div className="text-red-500 font-black text-xs uppercase tracking-widest py-2">
                Order Cancelled
              </div>
            ) : (
              <div className="relative space-y-6">
                <div className="absolute left-[11px] top-3 bottom-3 w-px bg-surface-200" />
                {(() => {
                  const stages = order.paymentMethod === 'cod'
                    ? ['confirmed', 'partially_shipped', 'shipped', 'delivered']
                    : ['pending', 'confirmed', 'partially_shipped', 'shipped', 'delivered'];
                  const statusMap = {
                    pending: 0,
                    confirmed: 1,
                    partially_shipped: 2,
                    shipped: 3,
                    delivered: 4
                  };
                  const currentIndex = statusMap[order.status] ?? 0;
                  return stages.map((stage) => {
                    const stageIndex = statusMap[stage];
                    const isCompleted = stageIndex <= currentIndex;
                    const isCurrent = stageIndex === currentIndex;
                    return (
                      <div key={stage} className="relative flex items-start gap-4">
                        <div className={['relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-surface-50', isCompleted ? 'border-brand-primary bg-brand-primary/20' : 'border-surface-200'].join(' ')}>
                          {isCompleted && <div className="h-2 w-2 rounded-full bg-brand-primary" />}
                        </div>
                        <div className="pt-0.5">
                          <p className={['text-[11px] font-black uppercase tracking-widest', isCompleted ? 'text-app-text' : 'text-app-text/40'].join(' ')}>
                            {stage.replace('_', ' ')}
                          </p>
                          {isCurrent && (
                            <p className="text-[9px] font-bold text-app-text/50 uppercase tracking-widest mt-1">
                              {stage === 'pending' && 'Order placed successfully'}
                              {stage === 'confirmed' && 'Fulfillment in progress'}
                              {stage === 'partially_shipped' && 'Some of your items have shipped'}
                              {stage === 'shipped' && 'All items handed over to delivery partners'}
                              {stage === 'delivered' && 'All items delivered successfully'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
