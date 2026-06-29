import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getVendors, toggleVendorStatus } from '../../services/user.service.js';
import { Loader2, Store, User, Mail, ShieldCheck, ShieldAlert, ExternalLink, Hash, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await getVendors();
      if (res?.success) setVendors(res.data?.vendors || res.data || []);
    } catch {
      toast.error('Failed to load vendors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleToggleStatus = async (id) => {
    setTogglingId(id);
    try {
      const res = await toggleVendorStatus(id);
      if (res.success) {
        toast.success(res.message);
        setVendors(prev => prev.map(v => v._id === id ? { ...v, isActive: !v.isActive } : v));
      }
    } catch (err) {
      toast.error('Status update failed');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading && vendors.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tighter text-app-text italic">Vendor Ecosystem</h2>
        <p className="text-xs text-app-text/50 font-medium">Monitor seller performance, manage active status, and analyze store data.</p>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#121214]/50 backdrop-blur-xl shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40">
                <th className="px-6 py-5">Merchant Identity</th>
                <th className="px-6 py-5">Direct Contact</th>
                <th className="px-6 py-5">Inventory Depth</th>
                <th className="px-6 py-5 text-center">Operational Status</th>
                <th className="px-6 py-5 text-center">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {vendors.map((v) => (
                <tr key={v._id} className="hover:bg-brand-primary/[0.02] transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-[1.25rem] bg-white/5 flex items-center justify-center text-brand-primary border border-white/10 shadow-2xl transition-all group-hover:rotate-6 group-hover:scale-110">
                        <Store className="h-6 w-6" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-app-text uppercase tracking-tight text-sm">{v.brandName || v.name}</span>
                        <span className="text-[9px] font-mono text-app-text/30 uppercase tracking-tighter flex items-center gap-1 mt-0.5">
                          <Hash className="h-2.5 w-2.5" /> {v._id.toString().slice(-8)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-app-text/70 font-bold group-hover:text-app-text transition-colors">
                        <Mail className="h-3.5 w-3.5 text-brand-primary/70" />
                        <span className="font-mono">{v.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-app-text/30 italic text-[10px]">
                        <User className="h-3.5 w-3.5" />
                        <span>{v.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                      {v.categories?.length > 0 ? v.categories.map((cat, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-brand-primary/10 text-[8px] font-black uppercase tracking-[0.15em] text-brand-primary border border-brand-primary/20">
                          {typeof cat === 'object' ? cat.name : cat}
                        </span>
                      )) : (
                        <span className="text-[9px] text-app-text/30 font-medium italic">Catalogue Empty</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => handleToggleStatus(v._id)}
                        disabled={togglingId === v._id}
                        className={`relative overflow-hidden group/btn inline-flex items-center gap-2 rounded-2xl px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${
                          v.isActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20'
                        } disabled:opacity-50 cursor-pointer`}
                      >
                        {togglingId === v._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : v.isActive ? (
                          <><div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Now</>
                        ) : (
                          <><ShieldAlert className="h-3.5 w-3.5 text-red-400" /> Suspended</>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center justify-center">
                      <Link
                        to={`/admin/vendors/${v._id}`}
                        className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-white/5 border border-white/10 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-app-text hover:bg-brand-primary hover:text-black hover:border-brand-primary/20 transition-all shadow-xl hover:scale-[1.03]"
                      >
                        Deep Dive
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vendors.length === 0 && !loading && (
            <div className="py-20 text-center">
              <Store className="h-12 w-12 text-app-text/10 mx-auto mb-4" />
              <p className="text-sm font-bold text-app-text/30 uppercase tracking-widest">No sellers found in registry</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
