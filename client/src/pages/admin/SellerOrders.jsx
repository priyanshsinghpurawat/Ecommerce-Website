import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { getAllOrders, updateOrderStatus } from '../../services/api.js';
import { Loader2, Eye, Truck, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Modal } from '../../components/Modal.jsx';

export const SellerOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchMyOrders = async (showLoading = true) => {
    if (!user?._id) return;
    if (showLoading) setLoading(true);
    try {
      const res = await getAllOrders({ seller: user._id });
      setOrders(res.data?.orders || res.data || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, [user]);

  const handleUpdateItemStatus = async (orderId, itemId, newStatus) => {
    setUpdating(true);
    try {
      await updateOrderStatus(orderId, { status: newStatus, itemId });
      toast.success(`Item marked as ${newStatus}`);
      
      // Optimistically update local orders list
      setOrders(prev => prev.map(o => {
        if (o._id !== orderId) return o;
        const updatedItems = o.items.map(item => item._id === itemId ? { ...item, status: newStatus } : item);
        return { ...o, items: updatedItems };
      }));

      // Optimistically update selected order in modal
      setSelectedOrder(prev => {
        if (!prev || prev._id !== orderId) return prev;
        const updatedItems = prev.items.map(item => item._id === itemId ? { ...item, status: newStatus } : item);
        return { ...prev, items: updatedItems };
      });

      // Background silent refetch
      fetchMyOrders(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-gray-500" /></div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Customer Orders</h2>
        <p className="text-base text-gray-600 mt-2">Manage fulfillment for your specific items across all customer orders.</p>
      </div>

      {orders.length === 0 ? (
        <div className="p-20 text-center border border-gray-200 bg-white rounded-2xl shadow-sm">
          <p className="text-gray-500 font-medium text-lg">No sales yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600">
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4 text-center">My Items</th>
                <th className="px-6 py-4">Order Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map(order => {
                const myItems = order.items.filter(it => String(it.vendor) === String(user._id));
                return (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900">{order.orderNumber}</td>
                    <td className="px-6 py-4">
                      <p className="text-base font-semibold text-gray-900">{order.user?.name}</p>
                      <p className="text-sm text-gray-500">{order.user?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 rounded-lg bg-gray-100 font-bold text-gray-700">
                        {myItems.length}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => { setSelectedOrder(order); setDetailModalOpen(true); }} 
                        className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-brand-primary hover:text-black transition-all shadow-sm"
                        title="View Fulfillment Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Fulfillment Detail Modal */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Fulfillment Details">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Shipping To</h4>
              <p className="text-base font-bold text-gray-900">{selectedOrder.shippingAddress?.fullName}</p>
              <p className="text-sm text-gray-600 mt-1">
                {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}<br />
                {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.zipCode}
              </p>
            </div>
            
            <div className="space-y-3">
               <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Your Items in this Order</h4>
               {selectedOrder.items
                 .filter(it => String(it.vendor) === String(user._id))
                 .map((it) => (
                 <div key={it._id} className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-base font-bold text-gray-900 block">{it.title}</span>
                        <span className="text-sm text-gray-500 block">Quantity: {it.quantity}</span>
                        <span className="text-sm text-gray-500 block">Status: <span className="font-bold text-gray-700 uppercase">{it.status}</span></span>
                      </div>
                      <span className="text-lg font-bold text-emerald-600">₹{(it.unitPrice * it.quantity).toLocaleString('en-IN')}</span>
                    </div>

                    {/* Action Buttons for this specific item */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                      {it.status === 'confirmed' && (
                        <button 
                          disabled={updating}
                          onClick={() => handleUpdateItemStatus(selectedOrder._id, it._id, 'shipped')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-200 transition-colors disabled:opacity-50"
                        >
                          <Truck className="w-4 h-4" /> Mark as Shipped
                        </button>
                      )}
                      {it.status === 'shipped' && (
                        <button 
                          disabled={updating}
                          onClick={() => handleUpdateItemStatus(selectedOrder._id, it._id, 'delivered')}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-200 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Mark as Delivered
                        </button>
                      )}
                      {it.status === 'delivered' && (
                        <span className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Delivered successfully
                        </span>
                      )}
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
