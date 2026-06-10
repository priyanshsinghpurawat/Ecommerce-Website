import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  getProfile, updateProfile, 
  addAddress, updateAddress, deleteAddress, setDefaultAddress 
} from '../services/user.service.js';
import { getMyOrders } from '../services/order.service.js';
import { 
  Loader2, User, MapPin, Package, Heart, Save, Plus, Trash2, 
  CheckCircle2, ChevronRight, ShoppingBag, Clock, ShieldCheck, 
  ExternalLink, Edit3, X, MapPinOff, Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { ProductCard } from '../components/ProductCard.jsx';
import { Modal } from '../components/Modal.jsx';
import { validateIndianPhone } from '../utils/phone.js';

export const Profile = () => {
  const { user, setUser } = useAuth();
  const { wishlist, fetchWishlist, toggleWishlist } = useWishlist();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);

  // Sync state to URL
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    avatar: ''
  });

  // Address Modal State
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    isDefault: false
  });

  useEffect(() => {
    const initData = async () => {
      try {
        const [profileRes, ordersRes] = await Promise.all([
          getProfile(),
          getMyOrders(),
          fetchWishlist()
        ]);

        if (profileRes?.success) {
          const u = profileRes.data;
          setProfileForm({
            name: u.name || '',
            phone: u.phone || '',
            avatar: u.avatar || ''
          });
        }
        if (ordersRes?.success) setOrders(ordersRes.data || []);
      } catch {
        toast.error('Failed to sync account data.');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const phoneCheck = validateIndianPhone(profileForm.phone);
    if (!phoneCheck.valid) return toast.error(phoneCheck.message);

    setSaving(true);
    try {
      const res = await updateProfile({ ...profileForm, phone: phoneCheck.digits });
      if (res?.success) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        toast.success('Profile synced.');
      }
    } catch {
      toast.error('Sync failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddressAction = async (e) => {
    e.preventDefault();
    const phoneCheck = validateIndianPhone(addressForm.phone);
    if (!phoneCheck.valid) return toast.error(phoneCheck.message);

    setSaving(true);
    try {
      let res;
      if (isEditingAddress) {
        res = await updateAddress(editingAddressId, { ...addressForm, phone: phoneCheck.digits });
      } else {
        res = await addAddress({ ...addressForm, phone: phoneCheck.digits });
      }

      if (res?.success) {
        setUser({ ...user, addresses: res.data });
        setAddressModalOpen(false);
        toast.success(isEditingAddress ? 'Address updated' : 'Address added');
      }
    } catch {
      toast.error('Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const openAddressModal = (addr = null) => {
    if (addr) {
      setIsEditingAddress(true);
      setEditingAddressId(addr._id);
      setAddressForm({ ...addr });
    } else {
      setIsEditingAddress(false);
      setAddressForm({
        fullName: user?.name || '',
        phone: user?.phone || '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India',
        isDefault: user?.addresses?.length === 0
      });
    }
    setAddressModalOpen(true);
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      const res = await deleteAddress(id);
      if (res.success) setUser({ ...user, addresses: res.data });
    } catch {
      toast.error('Deletion failed');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await setDefaultAddress(id);
      if (res.success) setUser({ ...user, addresses: res.data });
    } catch {
      toast.error('Update failed');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-app-text/30 italic">Synchronizing Hub...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ShieldCheck },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'address', label: 'Address Book', icon: MapPin },
    { id: 'orders', label: 'Order History', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
      
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-12 p-8 rounded-[3rem] bg-app-card border border-border-base shadow-soft relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative group shrink-0">
          <div className="h-24 w-24 rounded-[2rem] overflow-hidden border-2 border-brand-primary/20 bg-app-bg flex items-center justify-center shadow-2xl transition-transform group-hover:scale-105">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-12 w-12 text-brand-primary/20" />
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-brand-primary text-black p-1.5 rounded-xl shadow-lg border border-black/10">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-app-text italic">{user?.name}</h1>
          <p className="text-xs font-bold text-app-text/40 uppercase tracking-widest mt-1">{user?.email}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
            <span className="px-3 py-1 rounded-full bg-app-text text-[9px] font-black uppercase tracking-widest text-brand-primary border border-white/5">
              Member Since {new Date(user?.createdAt).getFullYear()}
            </span>
            <span className="px-3 py-1 rounded-full bg-app-text text-[9px] font-black uppercase tracking-widest text-brand-primary border border-white/5">
              Tier: Premium
            </span>
          </div>
        </div>
      </div>

      {/* Unified Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Navigation Sidebar */}
        <aside className="lg:sticky lg:top-24 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all group ${
                activeTab === tab.id 
                  ? 'bg-brand-primary text-black shadow-xl shadow-brand-primary/10' 
                  : 'bg-app-card text-app-text/40 hover:text-app-text hover:bg-surface-50/50 border border-border-base'
              }`}
            >
              <tab.icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-black' : 'text-brand-primary/40 group-hover:text-brand-primary'}`} />
              {tab.label}
              {activeTab === tab.id && <ChevronRight className="h-4 w-4 ml-auto" />}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-3 min-h-[60vh] animate-in slide-in-from-right-4 duration-500">
          
          {/* 1. OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: 'Purchases', value: orders.length, icon: ShoppingBag, color: 'text-brand-primary' },
                  { label: 'Stashed', value: wishlist.length, icon: Heart, color: 'text-red-500' },
                  { label: 'Status', value: 'Verified', icon: ShieldCheck, color: 'text-emerald-500' }
                ].map((stat, i) => (
                  <div key={i} className="bg-app-card border border-border-base p-6 rounded-[2rem] shadow-soft">
                    <p className="text-[9px] font-black uppercase tracking-widest text-app-text/30 mb-3">{stat.label}</p>
                    <div className="flex items-center justify-between">
                      <h3 className={`text-2xl font-black tracking-tight ${stat.color}`}>{stat.value}</h3>
                      <stat.icon className="h-6 w-6 opacity-20" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-app-card border border-border-base rounded-[2.5rem] p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-black uppercase tracking-widest text-app-text italic flex items-center gap-2">
                    <Clock className="h-4 w-4 text-brand-primary" /> Recent Activity
                  </h2>
                </div>
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.slice(0, 2).map((order) => (
                      <div key={order._id} className="flex items-center justify-between p-5 rounded-2xl bg-app-bg border border-border-base group hover:border-brand-primary/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-app-text flex items-center justify-center text-brand-primary">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-app-text">Order {order.orderNumber}</p>
                            <p className="text-[9px] font-bold text-app-text/30 uppercase mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-xs font-black text-app-text">₹{order.total.toLocaleString()}</span>
                          <ChevronRight className="h-4 w-4 text-app-text/20 group-hover:text-brand-primary" />
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setActiveTab('orders')} className="w-full py-3 text-[9px] font-black uppercase tracking-[0.2em] text-brand-primary hover:underline">View All History</button>
                  </div>
                ) : (
                  <div className="text-center py-10 opacity-30 italic text-xs font-bold uppercase">No recent activity found.</div>
                )}
              </div>
            </div>
          )}

          {/* 2. PROFILE MANAGEMENT */}
          {activeTab === 'profile' && (
            <div className="bg-app-card border border-border-base rounded-[2.5rem] p-8 lg:p-12 shadow-soft">
              <h2 className="text-xl font-black uppercase tracking-tight text-app-text italic mb-8">Personal Details</h2>
              <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Avatar URL</label>
                  <input
                    name="avatar"
                    value={profileForm.avatar}
                    onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                    className="w-full rounded-2xl border border-border-base bg-app-bg px-5 py-3.5 text-xs font-bold focus:outline-none focus:border-brand-primary"
                    placeholder="Profile Image URL"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Display Name</label>
                  <input
                    name="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full rounded-2xl border border-border-base bg-app-bg px-5 py-3.5 text-xs font-bold focus:outline-none focus:border-brand-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Phone Hub</label>
                  <input
                    name="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full rounded-2xl border border-border-base bg-app-bg px-5 py-3.5 text-xs font-bold focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="md:col-span-2 mt-4 pt-8 border-t border-border-base">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-3 rounded-2xl bg-app-text px-8 py-4 text-[11px] font-black uppercase tracking-widest text-brand-primary hover:bg-brand-primary hover:text-black transition-all shadow-xl shadow-brand-primary/5 active:scale-95 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Synchronize Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. ADDRESS BOOK */}
          {activeTab === 'address' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase tracking-tight text-app-text italic">Address Registry</h2>
                <button
                  onClick={() => openAddressModal()}
                  className="flex items-center gap-2 rounded-2xl bg-app-text px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-brand-primary hover:bg-brand-primary hover:text-black transition-all shadow-md"
                >
                  <Plus className="h-4 w-4" /> New Entry
                </button>
              </div>

              {(user?.addresses || []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(user?.addresses || []).map((addr) => (
                    <div key={addr._id} className={`p-6 rounded-[2rem] border transition-all ${addr.isDefault ? 'bg-app-card border-brand-primary shadow-xl shadow-brand-primary/5' : 'bg-app-card border-border-base'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className={`h-4 w-4 ${addr.isDefault ? 'text-brand-primary' : 'text-app-text/20'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-app-text">
                            {addr.fullName}
                          </span>
                        </div>
                        {addr.isDefault && <span className="text-[8px] font-black uppercase tracking-widest bg-brand-primary text-black px-2 py-0.5 rounded-md">Default</span>}
                      </div>
                      <div className="space-y-1 text-[11px] text-app-text/60 font-medium leading-relaxed">
                        <p>{addr.street}</p>
                        <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                        <p className="font-mono text-[10px] mt-2 italic text-app-text/40">{addr.phone}</p>
                      </div>
                      <div className="mt-6 flex items-center gap-3 pt-4 border-t border-border-base">
                        <button onClick={() => openAddressModal(addr)} className="p-2 rounded-xl bg-app-bg text-app-text/40 hover:text-brand-primary transition-colors"><Edit3 className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteAddress(addr._id)} className="p-2 rounded-xl bg-app-bg text-app-text/40 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        {!addr.isDefault && (
                          <button onClick={() => handleSetDefault(addr._id)} className="ml-auto text-[9px] font-black uppercase tracking-widest text-brand-primary hover:underline">Set Default</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-border-base rounded-[3rem]">
                  <MapPinOff className="h-12 w-12 text-app-text/10 mx-auto mb-4" />
                  <p className="text-sm font-black text-app-text/30 uppercase tracking-widest italic">No registered addresses</p>
                </div>
              )}
            </div>
          )}

          {/* 4. ORDER HISTORY */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black uppercase tracking-tight text-app-text italic mb-8">Purchase Archive</h2>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order._id} className="block rounded-[2rem] border border-border-base bg-app-card p-6 hover:border-brand-primary/40 transition-all group">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-[#1a1a1a] flex items-center justify-center text-brand-primary border border-white/5 shadow-2xl transition-all group-hover:scale-110">
                            <ShoppingBag className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-black text-sm text-app-text uppercase tracking-tighter italic">{order.orderNumber}</p>
                            <p className="text-[9px] font-bold text-app-text/30 uppercase mt-0.5 tracking-widest">
                              Placed {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black text-app-text/40 uppercase tracking-widest">Amount</p>
                            <p className="text-sm font-black text-app-text italic">₹{order.total.toLocaleString()}</p>
                          </div>
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                            order.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                            'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
                          }`}>
                            {order.status}
                          </span>
                          <button className="p-3 rounded-2xl bg-app-bg text-app-text/20 hover:text-brand-primary group-hover:bg-app-text transition-all">
                             <ExternalLink className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-border-base rounded-[3rem]">
                  <Package className="h-12 w-12 text-app-text/10 mx-auto mb-4" />
                  <p className="text-sm font-black text-app-text/30 uppercase tracking-widest italic">No orders logged</p>
                </div>
              )}
            </div>
          )}

          {/* 5. WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="space-y-8">
               <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase tracking-tight text-app-text italic">Curated Stash</h2>
                <span className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest bg-surface-100 px-3 py-1 rounded-full">{wishlist.length} Items</span>
              </div>
              
              {wishlist.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {wishlist.map((prod) => (
                    <div key={prod._id} className="group relative">
                      <ProductCard product={prod} />
                      <button
                        onClick={() => toggleWishlist(prod._id)}
                        className="absolute top-4 right-4 z-30 p-2.5 rounded-2xl bg-black/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:scale-110 active:scale-95"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-border-base rounded-[3rem]">
                  <Sparkles className="h-12 w-12 text-app-text/10 mx-auto mb-4" />
                  <p className="text-sm font-black text-app-text/30 uppercase tracking-widest italic">Your stash is empty</p>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Address Modal */}
      <Modal 
        isOpen={addressModalOpen} 
        onClose={() => setAddressModalOpen(false)}
        title={isEditingAddress ? 'Update Entry' : 'New Registry Entry'}
      >
        <form onSubmit={handleAddressAction} className="space-y-5 max-h-[80vh] overflow-y-auto px-1 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Recipient Full Name</label>
            <input
              value={addressForm.fullName}
              onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
              className="w-full rounded-2xl border border-border-base bg-app-bg px-5 py-3.5 text-xs font-bold focus:outline-none focus:border-brand-primary"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Direct Phone</label>
            <input
              value={addressForm.phone}
              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
              className="w-full rounded-2xl border border-border-base bg-app-bg px-5 py-3.5 text-xs font-bold focus:outline-none focus:border-brand-primary"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Street & Number</label>
            <input
              value={addressForm.street}
              onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
              className="w-full rounded-2xl border border-border-base bg-app-bg px-5 py-3.5 text-xs font-bold focus:outline-none focus:border-brand-primary"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">City</label>
              <input
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                className="w-full rounded-2xl border border-border-base bg-app-bg px-5 py-3.5 text-xs font-bold focus:outline-none focus:border-brand-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">State</label>
              <input
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                className="w-full rounded-2xl border border-border-base bg-app-bg px-5 py-3.5 text-xs font-bold focus:outline-none focus:border-brand-primary"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Zip Code</label>
              <input
                value={addressForm.zipCode}
                onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                className="w-full rounded-2xl border border-border-base bg-app-bg px-5 py-3.5 text-xs font-bold focus:outline-none focus:border-brand-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Country</label>
              <input
                value={addressForm.country}
                onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                className="w-full rounded-2xl border border-border-base bg-app-bg px-5 py-3.5 text-xs font-bold focus:outline-none focus:border-brand-primary"
                disabled
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={addressForm.isDefault}
              onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
              className="h-5 w-5 rounded-lg border-border-base bg-app-bg text-brand-primary focus:ring-brand-primary"
            />
            <label htmlFor="isDefault" className="text-[11px] font-black uppercase tracking-widest text-app-text/60 cursor-pointer">Set as Primary Shipping Address</label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-app-text text-brand-primary font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-brand-primary hover:text-black transition-all shadow-xl disabled:opacity-50 mt-4"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Synchronize Registry'}
          </button>
        </form>
      </Modal>

    </div>
  );
};
