import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSellerProfile } from '../../services/user.service.js';
import { 
  Loader2, ArrowLeft, Store, Mail, Phone, MapPin, 
  Package, ShoppingCart, DollarSign, PlusCircle, 
  Ticket, ClipboardList, Clock, Tag, TrendingUp 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminSellerProfile = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getSellerProfile(id);
        if (res?.success) setData(res.data);
      } catch {
        toast.error('Failed to load seller profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  const { seller, stats, products: rawProducts, topProducts, recentOrders } = data;
  const products = rawProducts || [];
  const formatCurrency = (val) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
          <Link
            to="/admin/sellers"
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-app-text/40 hover:text-app-text transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Registry
          </Link>
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-[1.5rem] bg-app-text flex items-center justify-center text-brand-primary shadow-2xl border border-white/10">
              <Store className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-app-text leading-none">
                {seller.brandName || seller.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  seller.isActive ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'
                }`}>
                  {seller.isActive ? 'Active Merchant' : 'Merchant Suspended'}
                </span>
                <span className="text-[10px] font-mono text-app-text/30">ID: {seller._id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Contact Card */}
        <div className="bg-app-card border border-border-base p-5 rounded-[2rem] shadow-soft flex flex-col gap-3 min-w-[280px]">
          <div className="flex items-center gap-3 text-xs font-bold text-app-text/70">
            <Mail className="h-4 w-4 text-brand-primary" />
            <span>{seller.email}</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-app-text/70">
            <Phone className="h-4 w-4 text-brand-primary" />
            <span>{seller.phone || 'No phone added'}</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-app-text/70">
            <MapPin className="h-4 w-4 text-brand-primary" />
            <span className="truncate">{seller.addresses?.[0]?.city || seller.address?.city || 'No City'}, {seller.addresses?.[0]?.country || seller.address?.country || 'No Country'}</span>
          </div>
        </div>
      </div>

      {/* Commercial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Merchant Catalog', value: stats?.totalProducts || 0, icon: Package, color: 'text-app-text' },
          { label: 'Orders in Pipeline', value: stats?.activeOrders || 0, icon: Clock, color: 'text-brand-primary' },
          { label: 'Settled Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: DollarSign, color: 'text-emerald-600' }
        ].map((stat, i) => (
          <div key={i} className="bg-app-card border border-border-base p-8 rounded-[2.5rem] shadow-soft group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:scale-150 transition-transform" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted mb-3 italic">{stat.label}</p>
            <div className="flex items-end justify-between relative z-10">
              <h3 className={`text-4xl font-black tracking-tighter italic ${stat.color}`}>{stat.value}</h3>
              <stat.icon className="h-8 w-8 opacity-10" />
            </div>
          </div>
        ))}
      </div>

      {/* Merchant Hub Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Sync Catalog', sub: 'Manual Entry', icon: PlusCircle, link: `/admin/products?seller=${seller._id}` },
          { label: 'Launch Campaign', sub: 'Coupon Forge', icon: Ticket, link: '/admin/coupons' },
          { label: 'Route Logistics', sub: 'Shipment Center', icon: ClipboardList, link: `/admin/orders?seller=${seller._id}` },
          { label: 'User Registry', sub: 'Live Tracking', icon: ShoppingCart, link: '/admin/users' }
        ].map((btn, i) => (
          <Link 
            key={i}
            to={btn.link}
            className="flex items-center gap-4 bg-[#121212] p-6 rounded-[2rem] text-brand-primary shadow-2xl border border-white/5 hover:bg-brand-primary hover:text-black transition-all group active:scale-95"
          >
            <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center group-hover:bg-black group-hover:text-brand-primary transition-colors">
              <btn.icon className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{btn.label}</p>
              <p className="text-[8px] font-bold opacity-50 uppercase tracking-tight mt-0.5">{btn.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="space-y-6">
          <h2 className="text-xl font-black uppercase tracking-tight text-app-text italic flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-primary" />
            Top Performers
          </h2>
          <div className="bg-app-card border border-border-base rounded-[2.5rem] overflow-hidden shadow-soft">
            <div className="divide-y divide-surface-100">
              {topProducts?.map((p, i) => (
                <div key={p._id} className="p-5 flex items-center gap-4 hover:bg-surface-50 transition-colors group">
                  <div className="text-[10px] font-black text-app-text/20 italic w-4">0{i+1}</div>
                  <img src={p.image} alt="" className="h-12 w-10 object-cover rounded-lg bg-surface-100" />
                  <div className="flex-1">
                    <h4 className="text-[11px] font-black uppercase tracking-tight text-app-text line-clamp-1">{p.title}</h4>
                    <p className="text-[9px] font-bold text-app-text/40 uppercase">{p.unitsSold} Units Sold</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-600 italic">₹{p.revenue.toLocaleString('en-IN')}</p>
                    <p className="text-[8px] font-bold text-app-text/30 uppercase tracking-tighter">Revenue</p>
                  </div>
                </div>
              ))}
              {(!topProducts || topProducts.length === 0) && (
                <div className="p-10 text-center text-[10px] font-bold text-app-text/30 uppercase italic">No sales data yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="space-y-6">
          <h2 className="text-xl font-black uppercase tracking-tight text-app-text italic flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-primary" />
            Recent Activity
          </h2>
          <div className="bg-app-card border border-border-base rounded-[2.5rem] overflow-hidden shadow-soft">
            <div className="divide-y divide-surface-100">
              {recentOrders?.map((o) => (
                <div key={o._id} className="p-5 flex items-center justify-between hover:bg-surface-50 transition-colors">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-app-text uppercase">#{o.orderNumber}</p>
                    <p className="text-[9px] font-bold text-app-text/40 uppercase">{o.customer} • {new Date(o.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-black text-app-text italic">₹{o.sellerSubtotal.toLocaleString('en-IN')}</p>
                      <p className="text-[8px] font-bold text-app-text/30 uppercase tracking-tighter">{o.sellerItemsCount} Items</p>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${
                      o.status === 'delivered' ? 'bg-emerald-500/15 text-emerald-400' : 
                      o.status === 'cancelled' ? 'bg-red-500/15 text-red-400' : 'bg-blue-500/15 text-blue-400'
                    }`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
              {(!recentOrders || recentOrders.length === 0) && (
                <div className="p-10 text-center text-[10px] font-bold text-app-text/30 uppercase italic">No recent orders</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Curated Catalog Section */}
      <div className="space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tight text-app-text italic">Full Catalog</h2>
          <span className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest bg-surface-100 px-3 py-1 rounded-full">{(products || []).length} active skus</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(products || []).map((p) => (
            <div key={p._id} className="flex gap-4 p-5 rounded-[2.2rem] border border-border-base bg-app-card hover:border-brand-primary/30 transition-all hover:shadow-xl group">
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-app-panel border border-border-base">
                <img 
                  src={p.image} 
                  alt="" 
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
              </div>
              <div className="flex-1 flex flex-col justify-between py-0.5">
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-tight text-app-text line-clamp-2 leading-snug">{p.title}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[8px] font-black uppercase tracking-widest text-brand-primary bg-app-text px-2 py-0.5 rounded-md">
                      {p.category?.name || 'Uncategorized'}
                    </span>
                    <span className="text-[8px] font-bold text-app-text/40 uppercase tracking-tighter">
                      {p.subcategory?.name || 'General'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-100/50">
                  <span className="text-sm font-black text-app-text italic tracking-tighter">₹{(p.discountedPrice || p.price).toLocaleString('en-IN')}</span>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-app-text/30 uppercase tracking-widest">
                    <Tag className="h-3 w-3" />
                    {p.stock} units
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(!products || products.length === 0) && (
          <div className="py-20 border-2 border-dashed border-border-base rounded-[3rem] text-center">
            <Package className="h-12 w-12 text-app-text/10 mx-auto mb-4" />
            <p className="text-sm font-bold text-app-text/30 uppercase tracking-widest italic">No products in catalog</p>
          </div>
        )}
      </div>
    </div>
  );
};
