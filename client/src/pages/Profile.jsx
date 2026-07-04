import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  getProfile, updateProfile, uploadAvatar,
  addAddress, updateAddress, deleteAddress, setDefaultAddress,
} from '../services/user.service.js';
import { getMyOrders } from '../services/order.service.js';
import { 
  Loader2, User, MapPin, Package, Heart, Save, Plus, Trash2, 
  CheckCircle2, ChevronRight, ShoppingBag, Clock, ShieldCheck, 
  ExternalLink, Edit3, X, MapPinOff, Sparkles, Camera
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { ProductCard } from '../components/ProductCard.jsx';
import { Modal } from '../components/Modal.jsx';
import { validateIndianPhone } from '../utils/helpers.js';
import { useSocket } from '../context/SocketContext.jsx';

export const Profile = () => {
  const { user, setUser } = useAuth();
  const { wishlist, fetchWishlist, toggleWishlist } = useWishlist();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Sync state to URL params
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

  // Avatar Upload State
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

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
        if (ordersRes?.success) setOrders(ordersRes.data?.orders || []);
      } catch {
        toast.error('Failed to sync account data.');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleOrderStatusUpdate = (data) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order._id === data.orderId) {
            toast.success(`Order ${data.orderNumber} is now ${data.status.toUpperCase()}`);
            return { ...order, status: data.status, items: data.items };
          }
          return order;
        })
      );
    };

    socket.on('orderStatusUpdated', handleOrderStatusUpdate);

    return () => {
      socket.off('orderStatusUpdated', handleOrderStatusUpdate);
    };
  }, [socket]);

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

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image must be under 5MB.');
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
      return toast.error('Use JPG, PNG, WEBP or AVIF.');
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    try {
      const res = await uploadAvatar(avatarFile);
      if (res?.success) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        setProfileForm(prev => ({ ...prev, avatar: res.data.avatar }));
        setAvatarFile(null);
        setAvatarPreview(null);
        toast.success('Avatar uploaded.');
      }
    } catch {
      toast.error('Upload failed.');
    } finally {
      setUploadingAvatar(false);
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

  // 3 Primary tabs: Dashboard, Order History, Wishlist
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: ShieldCheck },
    { id: 'orders', label: 'Order History', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
      
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-12 p-8 rounded-[3rem] glass-card-premium relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative group shrink-0">
          <div className="h-24 w-24 rounded-[2rem] overflow-hidden border-2 border-brand-primary/20 bg-app-bg flex items-center justify-center shadow-2xl transition-transform group-hover:scale-105">
            {user?.avatar ? (
              <img src={user.avatar} alt={`${user.name || 'User'}'s avatar`} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-brand-primary text-black flex items-center justify-center font-black text-3xl">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
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
            <span className="px-4 py-1.5 rounded-full badge-glass text-[9px] font-black uppercase tracking-widest shadow-md">
              Member Since {new Date(user?.createdAt).getFullYear()}
            </span>
            <span className="px-4 py-1.5 rounded-full badge-glass text-[9px] font-black uppercase tracking-widest shadow-md">
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
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all group cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-brand-primary text-black shadow-xl shadow-brand-primary/10 border border-transparent' 
                  : 'glass-card-premium text-app-text/40 hover:text-app-text hover:bg-white/10'
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
          
          {/* 1. UNIFIED DASHBOARD TAB (Merges Overview Stats, Personal Details form, and Address Book list) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              
              {/* Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: 'Purchases', value: orders.length, icon: ShoppingBag, color: 'text-brand-primary' },
                  { label: 'Stashed', value: wishlist.length, icon: Heart, color: 'text-red-500' },
                  { label: 'Status', value: 'Verified', icon: ShieldCheck, color: 'text-brand-primary' }
                ].map((stat, i) => (
                  <div key={i} className="glass-card-premium p-6 rounded-[2rem]">
                    <p className="text-[9px] font-black uppercase tracking-widest text-app-text/30 mb-3">{stat.label}</p>
                    <div className="flex items-center justify-between">
                      <h3 className={`text-2xl font-black tracking-tight ${stat.color}`}>{stat.value}</h3>
                      <stat.icon className="h-6 w-6 opacity-20" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid: Profile Form + Address Book */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Personal Details Form Box */}
                <div className="lg:col-span-6 glass-card-premium rounded-[2.5rem] p-8 space-y-6">
                  <h2 className="text-sm font-black uppercase tracking-widest text-brand-primary italic">Personal Details</h2>
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Profile Avatar</label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="relative group flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:border-brand-primary/30 transition-all cursor-pointer"
                      >
                        <div className="h-16 w-16 rounded-xl overflow-hidden bg-brand-primary flex items-center justify-center shrink-0">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                          ) : profileForm.avatar ? (
                            <img src={profileForm.avatar} alt="Current avatar" className="h-full w-full object-cover" />
                          ) : (
                            <Camera className="h-6 w-6 text-black" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-app-text truncate">
                            {avatarFile ? avatarFile.name : 'Click to select image'}
                          </p>
                          <p className="text-[9px] font-bold text-app-text/30 uppercase mt-0.5">JPG, PNG, WEBP or AVIF &bull; Max 5MB</p>
                        </div>
                        {avatarFile && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAvatarFile(null);
                              setAvatarPreview(null);
                            }}
                            className="p-1.5 rounded-lg bg-black text-white/40 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                      {avatarFile && (
                        <button
                          type="button"
                          onClick={handleAvatarUpload}
                          disabled={uploadingAvatar}
                          className="w-full flex items-center justify-center gap-2 mt-2 rounded-2xl border border-brand-primary/40 bg-brand-primary/10 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-brand-primary hover:bg-brand-primary/20 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                          Upload Avatar
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Display Name</label>
                      <input
                        name="name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full rounded-2xl glass-input px-5 py-3.5 text-xs font-bold focus:outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Phone Hub</label>
                      <input
                        name="phone"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full rounded-2xl glass-input px-5 py-3.5 text-xs font-bold focus:outline-none"
                      />
                    </div>
                    <div className="pt-4 border-t border-white/5">
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-3 rounded-2xl bg-brand-primary px-8 py-4 text-[11px] font-black uppercase tracking-widest text-black hover:opacity-90 transition-all shadow-xl shadow-brand-primary/10 active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Sync Personal Details
                      </button>
                    </div>
                  </form>
                </div>

                {/* Address Book Registry Box */}
                <div className="lg:col-span-6 glass-card-premium rounded-[2.5rem] p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-widest text-brand-primary italic">Address Registry</h2>
                    <button
                      onClick={() => openAddressModal()}
                      className="flex items-center gap-1.5 rounded-xl bg-brand-primary px-3.5 py-2 text-[9px] font-black uppercase tracking-widest text-black hover:opacity-90 transition-all shadow-md cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> ADD
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1.5 scrollbar-thin">
                    {(user?.addresses || []).length > 0 ? (
                      (user?.addresses || []).map((addr) => (
                        <div key={addr._id} className={`p-5 rounded-2xl transition-all border ${addr.isDefault ? 'border-brand-primary/40 bg-brand-primary/[0.02]' : 'border-white/5 bg-white/2 hover:border-white/10'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-1.5">
                              <MapPin className={`h-3.5 w-3.5 ${addr.isDefault ? 'text-brand-primary' : 'text-white/20'}`} />
                              <span className="text-[10px] font-black uppercase tracking-widest text-white truncate max-w-[120px]">
                                {addr.fullName}
                              </span>
                            </div>
                            {addr.isDefault && <span className="text-[7px] font-black uppercase tracking-widest bg-brand-primary text-black px-2 py-0.5 rounded-md">Default</span>}
                          </div>
                          <div className="space-y-0.5 text-[10px] text-white/50 font-medium leading-relaxed font-sans">
                            <p>{addr.street}</p>
                            <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                            <p className="font-mono text-[9px] mt-1.5 italic text-white/30">{addr.phone}</p>
                          </div>
                          <div className="mt-4 flex items-center gap-2 pt-3.5 border-t border-white/5">
                            <button onClick={() => openAddressModal(addr)} className="p-1.5 rounded-lg bg-black text-white/40 hover:text-brand-primary transition-colors cursor-pointer"><Edit3 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleDeleteAddress(addr._id)} className="p-1.5 rounded-lg bg-black text-white/40 hover:text-red-500 transition-colors cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                            {!addr.isDefault && (
                              <button onClick={() => handleSetDefault(addr._id)} className="ml-auto text-[8px] font-black uppercase tracking-widest text-brand-primary hover:underline cursor-pointer">Set Default</button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl">
                        <MapPinOff className="h-8 w-8 text-white/10 mx-auto mb-3" />
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest italic">No registered addresses</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Recent Activity Table */}
              <div className="glass-card-premium rounded-[2.5rem] p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-black uppercase tracking-widest text-app-text italic flex items-center gap-2">
                    <Clock className="h-4 w-4 text-brand-primary" /> Recent Activity
                  </h2>
                </div>
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.slice(0, 2).map((order) => (
                      <Link to={`/orders/${order._id}`} key={order._id} className="block cursor-pointer">
                        <div className="flex items-center justify-between p-5 rounded-2xl glass-card-premium group hover:!border-brand-primary/30 transition-all">
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
                            <div className="p-1">
                              <ChevronRight className="h-4 w-4 text-app-text/20 group-hover:text-brand-primary" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    <button onClick={() => setActiveTab('orders')} className="w-full py-3 text-[9px] font-black uppercase tracking-[0.2em] text-brand-primary hover:underline cursor-pointer">View All History</button>
                  </div>
                ) : (
                  <div className="text-center py-10 opacity-30 italic text-xs font-bold uppercase">No recent activity found.</div>
                )}
              </div>
            </div>
          )}

          {/* 2. ORDER HISTORY ARCHIVE */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black uppercase tracking-tight text-app-text italic mb-8">Purchase Archive</h2>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Link to={`/orders/${order._id}`} key={order._id} className="block rounded-[2rem] glass-card-premium p-6 hover:!border-brand-primary/40 transition-all group cursor-pointer">
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
                          <div className="p-3 rounded-2xl bg-app-bg text-app-text/20 group-hover:text-brand-primary group-hover:bg-app-text transition-all">
                             <ExternalLink className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    </Link>
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

          {/* 3. WISHLIST / CURATED STASH */}
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
                        className="absolute top-4 right-4 z-30 p-2.5 rounded-2xl bg-black/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:scale-110 active:scale-95 cursor-pointer"
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

      {/* Address Modal Registry dialog */}
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
              className="w-full rounded-2xl glass-input px-5 py-3.5 text-xs font-bold focus:outline-none"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Direct Phone</label>
            <input
              value={addressForm.phone}
              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
              className="w-full rounded-2xl glass-input px-5 py-3.5 text-xs font-bold focus:outline-none"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Street & Number</label>
            <input
              value={addressForm.street}
              onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
              className="w-full rounded-2xl glass-input px-5 py-3.5 text-xs font-bold focus:outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">City</label>
              <input
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                className="w-full rounded-2xl glass-input px-5 py-3.5 text-xs font-bold focus:outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">State</label>
              <input
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                className="w-full rounded-2xl glass-input px-5 py-3.5 text-xs font-bold focus:outline-none"
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
                className="w-full rounded-2xl glass-input px-5 py-3.5 text-xs font-bold focus:outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Country</label>
              <input
                value={addressForm.country}
                onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                className="w-full rounded-2xl glass-input px-5 py-3.5 text-xs font-bold focus:outline-none disabled:opacity-40"
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
            className="w-full py-4 bg-brand-primary text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:opacity-90 transition-all shadow-xl disabled:opacity-50 mt-4 cursor-pointer"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Synchronize Registry'}
          </button>
        </form>
      </Modal>

    </div>
  );
};
