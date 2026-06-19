import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllOrders, updateOrderStatus } from '../../services/api.js';
import { Loader2, Package, Search, Eye, ArrowUpDown, ChevronDown, CheckCircle, Clock, Truck, XCircle, Download, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Modal } from '../../components/Modal.jsx';

export const AdminOrders = () => {
  const [searchParams] = useSearchParams();
  const sellerId = searchParams.get('seller');
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  // Modal Control
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await getAllOrders({ search, status, seller: sellerId });
      if (res?.success) setOrders(res.data?.orders || res.data || []);
    } catch {
      toast.error('Failed to load orders.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, status, sellerId]);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await updateOrderStatus(id, newStatus);
      if (res.success) {
        toast.success('Order status updated');
        // Optimistically update local orders list
        setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
        // Sync selectedOrder state to update the modal content in real-time
        setSelectedOrder(prev => prev && prev._id === id ? { ...prev, status: newStatus } : prev);
        // Silent background refresh
        fetchOrders(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) return;
    const headers = ['Order Number', 'Customer', 'Email', 'Items', 'Total', 'Status', 'Date'];
    const csvData = orders.map(o => [
      o.orderNumber,
      o.user?.name || 'N/A',
      o.user?.email || 'N/A',
      o.items?.length || 0,
      o.total,
      o.status,
      new Date(o.createdAt).toLocaleDateString()
    ]);
    
    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_export_${new Date().toISOString().slice(0,10)}.csv`);
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
          <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Manage customer purchases and update delivery status.</p>
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
                  <th className="px-5 py-5">Items</th>
                  <th className="px-5 py-5">Total</th>
                  <th className="px-5 py-5">Status</th>
                  <th className="px-5 py-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base text-xs font-bold text-app-text">
                {orders.map((order) => (
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
                        {order.items?.length || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-black tracking-tighter text-app-text italic">
                      ₹{order.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(order.status)} shadow-sm`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                        
                        <div className="relative group/status">
                          <select
                            disabled={updatingId === order._id}
                            value={order.status}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <div className="p-1.5 rounded-lg hover:bg-app-bg text-muted hover:text-app-text transition-colors border border-transparent hover:border-border-base">
                            {updatingId === order._id ? (
                              <Loader2 className="h-3 w-3 animate-spin text-brand-primary" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </div>
                        </div>
                      </div>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Order Details: ${selectedOrder?.orderNumber}`}
      >
        {selectedOrder && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar print:max-h-none print:overflow-visible">
            {/* Invoice Header (Visible only on print) */}
            <div className="hidden print:block border-b-2 border-app-text pb-6 mb-6">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tighter text-app-text">MENSVIBE</h1>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Jaipur Studio · Premium Apparel</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-black uppercase italic text-app-text">INVOICE</h2>
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
                Print Invoice
              </button>
            </div>

            {/* Customer & Shipping */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted">Customer Info</h4>
                <div className="p-3 rounded-2xl bg-app-bg border border-border-base shadow-sm">
                  <p className="text-xs font-black italic text-app-text uppercase tracking-tighter">{selectedOrder.user?.name}</p>
                  <p className="text-[10px] text-muted font-bold">{selectedOrder.user?.email}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted">Shipping Address</h4>
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
            </div>

            {/* Items Table */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted">Order Items</h4>
              <div className="overflow-hidden rounded-2xl border border-border-base bg-app-bg shadow-sm">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-surface-100 text-muted">
                    <tr>
                      <th className="px-4 py-3 font-black uppercase tracking-widest">Product</th>
                      <th className="px-4 py-3 font-black uppercase tracking-widest text-center">Qty</th>
                      <th className="px-4 py-3 font-black uppercase tracking-widest text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-base text-app-text font-bold">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-app-text/5">
                        <td className="px-4 py-3 uppercase tracking-tighter italic">{item.title}</td>
                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-black italic tracking-tighter">₹{item.unitPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-surface-100 font-black text-app-text">
                    <tr>
                      <td colSpan="2" className="px-4 py-2 text-right uppercase tracking-[0.2em] text-[10px]">Subtotal</td>
                      <td className="px-4 py-2 text-right italic tracking-tighter">₹{selectedOrder.subtotal.toFixed(2)}</td>
                    </tr>
                    {selectedOrder.discountAmount > 0 && (
                      <tr className="text-success">
                        <td colSpan="2" className="px-4 py-2 text-right uppercase tracking-[0.2em] text-[10px]">
                          Discount ({selectedOrder.couponCode})
                        </td>
                        <td className="px-4 py-2 text-right italic tracking-tighter">-₹{selectedOrder.discountAmount.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="text-lg bg-app-text/5 border-t border-border-base">
                      <td colSpan="2" className="px-4 py-4 text-right uppercase tracking-[0.3em] text-[11px] font-black italic">Grand Total</td>
                      <td className="px-4 py-4 text-right font-black italic text-brand-primary tracking-tighter underline decoration-brand-primary/30 underline-offset-4">₹{selectedOrder.total.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Change Status (inside details) */}
            <div className="pt-6 border-t border-border-base flex items-center justify-between print:hidden">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Current Status</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(selectedOrder.status)} shadow-md transition-all`}>
                    {getStatusIcon(selectedOrder.status)}
                    {selectedOrder.status}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Quick Update:</span>
                <div className="flex gap-2">
                  {['shipped', 'delivered', 'cancelled'].filter(s => s !== selectedOrder.status).map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selectedOrder._id, s)}
                      className="px-3 py-1.5 rounded-xl border border-border-base bg-app-bg text-[9px] font-black uppercase tracking-widest text-muted hover:bg-app-text hover:text-black transition-all shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
