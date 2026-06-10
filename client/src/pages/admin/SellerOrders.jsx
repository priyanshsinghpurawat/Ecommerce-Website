import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { getAllOrders } from '../../services/order.service.js';
import { Loader2, Package, Search, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Modal } from '../../components/Modal.jsx';

export const SellerOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchMyOrders = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const res = await getAllOrders({ seller: user._id });
      setOrders(res.data || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, [user]);

  if (loading) {
    return <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-app-text/20" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold uppercase tracking-wider text-app-text">Customer Orders</h2>
        <p className="text-xs text-app-text/50">Orders containing your listed products.</p>
      </div>

      {orders.length === 0 ? (
        <div className="p-20 text-center border-2 border-dashed border-border-base rounded-[40px]">
          <p className="text-muted font-bold uppercase text-xs">No sales yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border-base bg-surface-50/40 shadow-soft">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-base bg-surface-50/30 text-[10px] font-bold uppercase tracking-wider text-muted">
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4 text-center">My Items</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base/40">
              {orders.map(order => (
                <tr key={order._id} className="hover:bg-surface-50/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-app-text">{order.orderNumber}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-app-text">{order.user?.name}</p>
                    <p className="text-[10px] text-muted">{order.user?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 rounded-lg bg-surface-100 border border-border-base font-bold text-app-text">
                        {order.items.length}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => { setSelectedOrder(order); setDetailModalOpen(true); }} className="p-2 rounded-xl bg-surface-50 text-app-text hover:bg-app-text hover:text-app-bg transition-all shadow-sm">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Sale Details">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-surface-50 border border-border-base">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Shipping To</h4>
              <p className="text-xs font-bold text-app-text">{selectedOrder.shippingAddress?.fullName}</p>
              <p className="text-[10px] text-muted">
                {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}<br />
                {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.zipCode}
              </p>
            </div>
            <div className="space-y-2">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-muted">Itemized Breakdown</h4>
               {selectedOrder.items.map((it, i) => (
                 <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-surface-100 border border-border-base">
                    <span className="text-xs font-bold text-app-text truncate max-w-[200px]">{it.title}</span>
                    <span className="text-[10px] font-mono font-black text-app-text">x{it.quantity}</span>
                 </div>
               ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
