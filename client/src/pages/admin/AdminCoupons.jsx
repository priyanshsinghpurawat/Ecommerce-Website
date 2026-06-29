import React, { useEffect, useState } from 'react';
import { 
  getCoupons, 
  createCoupon, 
  updateCoupon, 
  deleteCoupon 
} from '../../services/coupon.service.js';
import { Modal } from '../../components/Modal.jsx';
import { Input } from '../../components/Input.jsx';
import { Pagination } from '../../components/Pagination.jsx';
import { Plus, Edit2, Trash2, Loader2, Tag, Calendar, AlertCircle, Search, ArrowUpDown, Power } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCoupons: 0
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  // Modal Control States
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minCartAmount: '',
    expiryDate: '',
    usageLimit: '',
    perUserLimit: '1',
    isActive: true,
    newUsersOnly: false,
    appliedProducts: '' // Comma separated IDs
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchCouponsList = async () => {
    setLoading(true);
    try {
      const response = await getCoupons({ search, status, page, limit: 10 });
      if (response && response.success) {
        setCoupons(response.data.coupons || []);
        setPagination(response.data.pagination || { currentPage: 1, totalPages: 1, totalCoupons: 0 });
      }
    } catch (err) {
      toast.error('Failed to fetch coupons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouponsList();
  }, [search, status, page]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      minCartAmount: '0',
      expiryDate: '',
      usageLimit: '',
      perUserLimit: '1',
      isActive: true,
      newUsersOnly: false,
      appliedProducts: ''
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleOpenEditModal = (coupon) => {
    setIsEditing(true);
    setEditingId(coupon._id);
    
    // Format date string for HTML input (YYYY-MM-DD)
    let formattedDate = '';
    if (coupon.expiryDate) {
      formattedDate = new Date(coupon.expiryDate).toISOString().split('T')[0];
    }

    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minCartAmount: coupon.minCartAmount.toString(),
      expiryDate: formattedDate,
      usageLimit: coupon.usageLimit !== null ? coupon.usageLimit.toString() : '',
      perUserLimit: coupon.perUserLimit.toString(),
      isActive: coupon.isActive,
      newUsersOnly: coupon.newUsersOnly || false,
      appliedProducts: coupon.appliedProducts ? coupon.appliedProducts.join(', ') : ''
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.code.trim()) errors.code = 'Coupon code is required';
    if (formData.code.trim().length > 20) errors.code = 'Coupon code must be under 20 characters';
    
    if (!formData.discountValue || Number(formData.discountValue) < 0) {
      errors.discountValue = 'Discount value cannot be negative';
    }
    if (formData.discountType === 'percentage' && Number(formData.discountValue) > 100) {
      errors.discountValue = 'Percentage discount cannot exceed 100%';
    }

    if (formData.minCartAmount && Number(formData.minCartAmount) < 0) {
      errors.minCartAmount = 'Minimum order amount cannot be negative';
    }

    if (formData.usageLimit && Number(formData.usageLimit) < 0) {
      errors.usageLimit = 'Usage limit cannot be negative';
    }

    if (!formData.perUserLimit || Number(formData.perUserLimit) < 1) {
      errors.perUserLimit = 'Per user limit must be at least 1';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitLoading(true);
    
    const appliedProductsArray = formData.appliedProducts 
      ? formData.appliedProducts.split(',').map(id => id.trim()).filter(id => id !== '')
      : [];

    const dataToSend = {
      code: formData.code.trim().toUpperCase(),
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      minCartAmount: formData.minCartAmount ? Number(formData.minCartAmount) : 0,
      expiryDate: formData.expiryDate || null,
      usageLimit: formData.usageLimit === '' ? null : Number(formData.usageLimit),
      perUserLimit: Number(formData.perUserLimit),
      isActive: formData.isActive,
      newUsersOnly: formData.newUsersOnly,
      appliedProducts: appliedProductsArray
    };

    try {
      let response;
      if (isEditing) {
        response = await updateCoupon(editingId, dataToSend);
      } else {
        response = await createCoupon(dataToSend);
      }

      if (response && response.success) {
        toast.success(isEditing ? 'Coupon updated successfully' : 'Coupon created successfully');
        setModalOpen(false);
        fetchCouponsList();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      toast.error(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (coupon) => {
    if (window.confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) {
      try {
        const response = await deleteCoupon(coupon._id);
        if (response && response.success) {
          toast.success('Coupon deleted successfully');
          fetchCouponsList();
        }
      } catch (err) {
        toast.error('Failed to delete coupon.');
      }
    }
  };

  const handleToggleStatus = async (coupon) => {
    try {
      const response = await updateCoupon(coupon._id, { isActive: !coupon.isActive });
      if (response && response.success) {
        toast.success(`Coupon ${!coupon.isActive ? 'activated' : 'deactivated'}`);
        fetchCouponsList();
      }
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-app-text">Coupons Registry</h2>
          <p className="text-xs text-app-text/50">Create, edit, or remove storefront promotional discount codes.</p>
        </div>
        
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 rounded-2xl bg-app-text px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-black hover:bg-app-text-hover shadow-md transition-all duration-300"
        >
          <Plus className="h-4 w-4" />
          Add Coupon
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center rounded-2xl border border-white/60 bg-surface-50/40 p-4 shadow-soft">
        
        {/* Search */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search coupon code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-full border border-surface-200 bg-surface-50 px-4 py-2 pl-10 font-sans text-xs text-app-text focus:outline-none"
          />
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-app-text/45" />
        </div>

        {/* Status Filter */}
        <div className="relative w-full sm:w-48">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full appearance-none rounded-full border border-surface-200 bg-surface-50 px-4 py-2 pr-10 font-sans text-xs text-app-text focus:outline-none"
          >
            <option value="all">Status: All</option>
            <option value="active">Status: Active</option>
            <option value="inactive">Status: Inactive</option>
          </select>
          <ArrowUpDown className="pointer-events-none absolute right-4 top-2.5 h-3.5 w-3.5 text-app-text/40" />
        </div>
      </div>

      {/* Coupons Table */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-full bg-surface-100 rounded-xl" />
          <div className="h-40 w-full bg-surface-100/50 rounded-xl" />
        </div>
      ) : coupons.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-white/60 bg-surface-50/40 shadow-soft backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50/30 text-[10px] font-bold uppercase tracking-wider text-app-text/45">
                  <th className="px-6 py-4">Coupon Code</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Discount Value</th>
                  <th className="px-6 py-4">Min. Spend</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4 text-center">Usage</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100/40 text-xs font-semibold text-app-text">
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-surface-50/20 transition-all">
                    <td className="px-6 py-4 font-mono font-bold tracking-wider text-brand-primary">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Tag className="h-3.5 w-3.5" />
                          {coupon.code}
                        </div>
                        {coupon.newUsersOnly && (
                          <span className="text-[8px] font-sans font-black uppercase tracking-wider text-brand-primary bg-brand-primary/10 border border-brand-primary/20 rounded px-1.5 py-0.5 w-max mt-0.5">
                            First Order Only
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 uppercase text-[10px] tracking-wider text-app-text/65">
                      {coupon.discountType}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold">
                      {coupon.discountType === 'percentage' 
                        ? `${coupon.discountValue}%` 
                        : `₹${coupon.discountValue.toFixed(2)}`
                      }
                    </td>
                    <td className="px-6 py-4 font-mono">
                      ₹{coupon.minCartAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-app-text/60 font-sans">
                      {coupon.expiryDate ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-app-text/35" />
                          {new Date(coupon.expiryDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-app-text/30">Never Expires</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex flex-col items-center">
                          <span className="font-mono text-brand-primary">{coupon.usageCount} / {coupon.usageLimit ?? '∞'}</span>
                          <span className="text-[8px] uppercase text-app-text/30 tracking-tighter">Uses Applied</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(coupon)}
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-all hover:scale-105 ${
                          coupon.isActive 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100' 
                            : 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-100'
                        }`}
                        title={coupon.isActive ? "Deactivate Coupon" : "Activate Coupon"}
                      >
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(coupon)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-100 text-app-text hover:bg-brand-primary hover:text-black transition-all shadow-sm"
                          title="Edit Coupon"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-black transition-all shadow-sm"
                          title="Delete Coupon"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            loading={loading}
          />
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-surface-200 bg-surface-50/20 p-12 text-center">
          <p className="font-sans text-xs text-app-text/50">No coupon codes registered in database yet.</p>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Coupon Code' : 'Create Promotional Coupon'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Coupon Code */}
          <Input
            label="Coupon Code"
            id="code"
            name="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="e.g. WELCOME50"
            disabled={isEditing}
            error={formErrors.code}
            className="font-mono uppercase !bg-surface-50"
          />

          {/* Discount Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-app-text/70">Discount Type</label>
              <select
                name="discountType"
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value, discountValue: '' })}
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-2.5 font-sans text-xs focus:outline-none focus:border-brand-primary"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>

            <Input
              label={formData.discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount (₹)'}
              id="discountValue"
              type="number"
              name="discountValue"
              value={formData.discountValue}
              onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
              placeholder={formData.discountType === 'percentage' ? 'e.g. 10' : 'e.g. 250'}
              error={formErrors.discountValue}
              className="!bg-surface-50"
            />
          </div>

          {/* Rules / Min Order & Expiry */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min. Spend Limit (₹)"
              id="minCartAmount"
              type="number"
              name="minCartAmount"
              value={formData.minCartAmount}
              onChange={(e) => setFormData({ ...formData, minCartAmount: e.target.value })}
              placeholder="e.g. 1000"
              error={formErrors.minCartAmount}
              className="!bg-surface-50"
            />

            <Input
              label="Expiry Date"
              id="expiryDate"
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              error={formErrors.expiryDate}
              className="!bg-surface-50"
            />
          </div>

          {/* Usage Safeguards */}
          <div className="p-4 rounded-2xl bg-app-bg border border-surface-200/50 space-y-4">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-brand-primary flex items-center gap-2">
              <AlertCircle className="h-3 w-3" /> Commercial Safeguards
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Total Usage Limit"
                id="usageLimit"
                type="number"
                placeholder="Infinite"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                error={formErrors.usageLimit}
                className="!bg-surface-50"
              />
              <Input
                label="Uses Per Customer"
                id="perUserLimit"
                type="number"
                value={formData.perUserLimit}
                onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                error={formErrors.perUserLimit}
                className="!bg-surface-50"
              />
            </div>
          </div>

          {/* Product Specific */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-app-text/60">Applied Products (IDs, comma separated)</label>
            <textarea
              name="appliedProducts"
              value={formData.appliedProducts}
              onChange={(e) => setFormData({ ...formData, appliedProducts: e.target.value })}
              placeholder="e.g. 64abc..., 64def..."
              rows="2"
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 font-mono text-[10px] focus:outline-none focus:border-brand-primary"
            />
            <p className="text-[9px] text-app-text/40 italic">Leave empty to apply to all products in cart.</p>
          </div>

          {/* Active & New Users Only Statuses */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-surface-200 text-app-text focus:ring-brand-primary"
              />
              <label htmlFor="isActive" className="text-[11px] font-bold uppercase tracking-wider text-app-text/70 cursor-pointer">
                Active (Ready for checkout)
              </label>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="newUsersOnly"
                checked={formData.newUsersOnly}
                onChange={(e) => setFormData({ ...formData, newUsersOnly: e.target.checked })}
                className="h-4 w-4 rounded border-surface-200 text-app-text focus:ring-brand-primary"
              />
              <label htmlFor="newUsersOnly" className="text-[11px] font-bold uppercase tracking-wider text-app-text/70 cursor-pointer">
                New Users Only (First Order Only)
              </label>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-app-text py-3 font-sans text-xs font-bold uppercase tracking-wider text-black hover:bg-app-text-hover transition-colors disabled:opacity-50"
          >
            {submitLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEditing ? (
              'Save Coupon changes'
            ) : (
              'Create Coupon Code'
            )}
          </button>

        </form>
      </Modal>

    </div>
  );
};
