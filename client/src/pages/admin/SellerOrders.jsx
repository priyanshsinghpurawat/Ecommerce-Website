import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { getAllOrders, updateOrderStatus } from '../../services/order.service.js';
import { Loader2, Package, Search, Eye, ArrowUpDown, ChevronDown, CheckCircle, Clock, Truck, XCircle, Download, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Modal } from '../../components/Modal.jsx';
import api from '../../services/api.js';

// State machine: defines which transitions are allowed from each status (matches backend)
const VALID_TRANSITIONS = {
  confirmed:        ['shipped', 'cancelled'],
  partially_shipped:['shipped', 'cancelled'],
  shipped:          ['delivered', 'cancelled'],
  delivered:        [],
  cancelled:        ['confirmed'],
};

export const SellerOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  // Modal Control
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async (showLoading = true) => {
    if (!user?._id) return;
    if (showLoading) setLoading(true);
    try {
      const res = await getAllOrders({ search, status, seller: user._id });
      if (res?.success) setOrders(res.data?.orders || res.data || []);
    } catch {
      toast.error('Failed to load orders.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, search, status]);

  const handleUpdateItemStatus = async (orderId, itemId, newStatus) => {
    setUpdatingId(orderId);
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
      fetchOrders(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleProcessReturn = async (orderId, itemId, returnStatus) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/orders/${orderId}/items/${itemId}/process-return`, { status: returnStatus });
      toast.success(`Return request ${returnStatus}`);
      fetchOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        const res = await api.get(`/orders/${orderId}`);
        setSelectedOrder(res.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process return');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) return;
    const headers = ['Order Number', 'Customer', 'Email', 'My Items', 'Status', 'Date'];
    const csvData = orders.map(o => {
      const myItems = o.items.filter(it => String(it.vendor) === String(user._id));
      return [
        o.orderNumber,
        o.user?.name || 'N/A',
        o.user?.email || 'N/A',
        myItems.length,
        o.status,
        new Date(o.createdAt).toLocaleDateString()
      ];
    });
    
    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `my_orders_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Orders exported to CSV');
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const getStatusStyle = (s) => {
    switch (s) {
      case 'confirmed': return 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20';
      case 'shipped': return 'bg-warning/10 text-warning border-warning/20';
      case 'delivered': return 'bg-success/10 text-success border-success/20';
      case 'cancelled': return 'bg-error/10 text-error border-error/20';
      default: return 'bg-surface-200 text-muted border-border-base';
    }
  };

  const getStatusIcon = (s) => {
    switch (s) {
      case 'confirmed': return <Clock className="h-3 w-3" />;
      case 'shipped': return <Truck className="h-3 w-3" />;
      case 'delivered': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest text-app-text italic">Store <span className="text-brand-primary">Orders</span></h2>
          <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Manage fulfillment for your listed items.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-app-text text-app-bg rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center rounded-2xl border border-border-base bg-surface-100 p-4 shadow-soft">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search order number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-border-base bg-app-bg px-4 py-2 pl-10 font-sans text-xs text-app-text focus:outline-none focus:border-brand-primary/50"
          />
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-muted" />
        </div>

        <div className="relative w-full sm:w-48">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full appearance-none rounded-full border border-border-base bg-app-bg px-4 py-2 pr-10 font-sans text-xs text-app-text focus:outline-none focus:border-brand-primary/50"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ArrowUpDown className="pointer-events-none absolute right-4 top-2.5 h-3.5 w-3.5 text-muted" />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-[2rem] border-2 border-dashed border-border-base bg-surface-100 p-12 text-center">
          <Package className="h-10 w-10 mx-auto text-muted mb-3 opacity-20" />
          <p className="text-[10px] text-muted font-black uppercase tracking-widest">No orders found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-base bg-surface-100 shadow-soft backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-base bg-app-bg/30 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  <th className="px-5 py-5">Order Number</th>
                  <th className="px-5 py-5">Customer</th>
                  <th className="px-5 py-5">My Items</th>
                  <th className="px-5 py-5">Status</th>
                  <th className="px-5 py-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base text-xs font-bold text-app-text">
                {orders.map((order) => {
                  const myItems = order.items.filter(it => String(it.vendor) === String(user._id));
                  return (
                    <tr key={order._id} className="hover:bg-app-text/5 transition-colors">
                      <td className="px-5 py-4 font-black tracking-widest italic text-brand-primary">{order.orderNumber}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-black italic uppercase tracking-tighter text-app-text">{order.user?.name || '—'}</span>
                          <span className="text-[10px] text-muted font-bold">{order.user?.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-app-bg border border-border-base text-app-text font-black tracking-tighter shadow-sm">
                          {myItems.length}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(order.status)} shadow-sm`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setDetailModalOpen(true);
                          }}
                          className="p-2 rounded-xl bg-app-bg border border-border-base text-app-text hover:bg-app-text hover:text-black transition-all shadow-sm"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fulfillment Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Fulfillment: ${selectedOrder?.orderNumber}`}
      >
        {selectedOrder && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar print:max-h-none print:overflow-visible">
            {/* Invoice Header (Visible only on print) */}
            <div className="hidden print:block border-b-2 border-app-text pb-6 mb-6">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tighter text-app-text">MENSVIBE</h1>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Vendor Fulfillment Sheet</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-black uppercase italic text-app-text">PACKING SLIP</h2>
                  <p className="text-sm font-black tracking-widest text-brand-primary">#{selectedOrder.orderNumber}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end print:hidden">
              <button 
                onClick={handlePrintInvoice}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary text-black rounded-lg font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-md"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Slip
              </button>
            </div>

            {/* Shipping Address */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted">Shipping To</h4>
              <div className="p-3 rounded-2xl bg-app-bg border border-border-base shadow-sm">
                <p className="text-xs font-black italic text-app-text uppercase tracking-tighter">{selectedOrder.shippingAddress?.fullName}</p>
                <p className="text-[10px] text-muted font-bold leading-relaxed">
                  {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}<br />
                  {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.zipCode}
                </p>
                <p className="text-[10px] font-black text-app-text mt-1">
                  Phone: {selectedOrder.shippingAddress?.phone}
                </p>
              </div>
            </div>

            {/* My Items in this order */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted">Your Items in this Order</h4>
              {selectedOrder.items
                .filter(it => String(it.vendor) === String(user._id))
                .map((it) => (
                  <div key={it._id} className="p-4 rounded-2xl bg-app-bg border border-border-base shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-black italic text-app-text block uppercase tracking-tighter">{it.title}</span>
                        <span className="text-[10px] text-muted font-bold block">Qty: {it.quantity}</span>
                        {it.size && <span className="text-[10px] text-muted font-bold block">Size: {it.size}</span>}
                        {it.color && <span className="text-[10px] text-muted font-bold block">Color: {it.color}</span>}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black italic text-brand-primary tracking-tighter">₹{(it.unitPrice * it.quantity).toLocaleString('en-IN')}</span>
                        <div className="mt-1 flex flex-col items-end gap-1">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border ${getStatusStyle(it.status)}`}>
                            {getStatusIcon(it.status)}
                            {it.status}
                          </span>
                          {it.returnStatus && it.returnStatus !== 'none' && (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border bg-purple-500/10 text-purple-500 border-purple-500/20">
                              Return: {it.returnStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {it.returnReason && (
                      <div className="mt-3 p-3 rounded-xl bg-app-bg/50 border border-border-base/50">
                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1">Return Reason:</p>
                        <p className="text-xs font-medium text-app-text">{it.returnReason}</p>
                      </div>
                    )}

                    {/* Action buttons based on valid transitions for THIS item's status */}
                    <div className="flex items-center gap-3 pt-3 border-t border-border-base print:hidden flex-wrap">
                      {(VALID_TRANSITIONS[it.status] || []).map(nextStatus => (
                        <button
                          key={nextStatus}
                          disabled={updatingId === selectedOrder._id || (it.returnStatus && it.returnStatus !== 'none')}
                          onClick={() => handleUpdateItemStatus(selectedOrder._id, it._id, nextStatus)}
                          className="px-3 py-1.5 rounded-xl border border-border-base bg-app-bg text-[9px] font-black uppercase tracking-widest text-muted hover:bg-app-text hover:text-black transition-all shadow-sm disabled:opacity-50"
                        >
                          Mark as {nextStatus}
                        </button>
                      ))}

                      {it.returnStatus === 'requested' && (
                        <>
                          <button
                            disabled={updatingId === selectedOrder._id}
                            onClick={() => handleProcessReturn(selectedOrder._id, it._id, 'approved')}
                            className="px-3 py-1.5 rounded-xl bg-brand-primary text-black text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50"
                          >
                            Approve Return
                          </button>
                          <button
                            disabled={updatingId === selectedOrder._id}
                            onClick={() => handleProcessReturn(selectedOrder._id, it._id, 'rejected')}
                            className="px-3 py-1.5 rounded-xl border border-error/50 text-error text-[9px] font-black uppercase tracking-widest hover:bg-error hover:text-white transition-colors disabled:opacity-50"
                          >
                            Reject Return
                          </button>
                        </>
                      )}

                      {it.returnStatus === 'approved' && (
                        <button
                          disabled={updatingId === selectedOrder._id}
                          onClick={() => handleProcessReturn(selectedOrder._id, it._id, 'refunded')}
                          className="px-3 py-1.5 rounded-xl bg-success text-white text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50"
                        >
                          Issue Refund (Complete Return)
                        </button>
                      )}

                      {(VALID_TRANSITIONS[it.status] || []).length === 0 && (!it.returnStatus || it.returnStatus === 'none' || it.returnStatus === 'refunded' || it.returnStatus === 'rejected') && (
                        <span className="text-[10px] font-black text-success flex items-center gap-2 uppercase tracking-widest">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {it.status === 'delivered' ? 'Delivered successfully' : it.status === 'returned' ? 'Return Completed' : 'Terminal state'}
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
