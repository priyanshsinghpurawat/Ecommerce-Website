import React, { useEffect, useState } from 'react';
import { getAllUsers, updateUserRole } from '../../services/user.service.js';
import { Loader2, User as UserIcon, Shield, ShoppingBag, Mail, Hash, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [openUserId, setOpenUserId] = useState(null);

  useEffect(() => {
    const handleClose = () => setOpenUserId(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      if (res?.success) setUsers(res.data?.users || res.data || []);
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (id, newRole) => {
    setUpdatingId(id);
    try {
      const res = await updateUserRole(id, newRole);
      if (res.success) {
        toast.success(`Role updated to ${newRole}`);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleStyle = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/10 text-purple-400 border-purple-500/25';
      case 'seller': return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      default: return 'bg-white/5 text-app-text/60 border-white/10';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-app-text/45" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-xl font-black uppercase tracking-wider text-app-text italic">User Registry</h2>
        <p className="text-xs text-app-text/50">Manage platform users, roles, and view their activity.</p>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#121214]/50 backdrop-blur-xl shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.15em] text-app-text/40">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-center">Total Orders</th>
                <th className="px-6 py-4 text-center">Status/Role</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-app-text/45 border border-white/10 shadow-sm">
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-app-text">{u.name}</span>
                        <span className="text-[9px] font-mono text-app-text/30 uppercase tracking-tighter">ID: {u._id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-app-text/60">
                        <Mail className="h-3.5 w-3.5 text-brand-primary/70" />
                        <span className="font-mono text-[11px]">{u.email}</span>
                      </div>
                      {u.phone && (
                        <div className="flex items-center gap-1.5 text-app-text/40">
                          <Hash className="h-3 w-3" />
                          <span className="font-mono">{u.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 shadow-sm min-w-[65px]">
                        <ShoppingBag className="h-3.5 w-3.5 text-brand-primary" />
                        <span className="font-black text-app-text text-[11px]">{u.totalOrders || 0}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border ${getRoleStyle(u.role)}`}>
                        {u.role === 'admin' && <Shield className="h-3 w-3 text-purple-400" />}
                        {u.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          disabled={updatingId === u._id}
                          onClick={() => setOpenUserId(openUserId === u._id ? null : u._id)}
                          className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-brand-primary/30 rounded-xl px-3 py-1.5 pr-8 text-[10px] font-black uppercase tracking-wider text-app-text/80 focus:outline-none focus:border-brand-primary cursor-pointer disabled:opacity-50 transition-all"
                        >
                          <span>Promote: {u.role}</span>
                          <ChevronDown className={`h-3 w-3 transition-transform ${openUserId === u._id ? 'rotate-180' : ''} text-app-text/40`} />
                        </button>
                        
                        {openUserId === u._id && (
                          <div className="absolute right-0 mt-1.5 w-40 rounded-xl border border-white/10 bg-[#121212]/95 backdrop-blur-xl py-1 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                            {[
                              { val: 'user', label: 'Promote: User' },
                              { val: 'seller', label: 'Promote: Seller' },
                              { val: 'admin', label: 'Promote: Admin' }
                            ].map((opt) => (
                              <button
                                key={opt.val}
                                onClick={() => {
                                  handleRoleChange(u._id, opt.val);
                                  setOpenUserId(null);
                                }}
                                className={`w-full text-left px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                                  u.role === opt.val
                                    ? 'text-brand-primary bg-white/5'
                                    : 'text-app-text/75 hover:text-brand-primary hover:bg-white/5'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {updatingId === u._id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-[#121214]/50 rounded-xl">
                            <Loader2 className="h-3 w-3 animate-spin text-brand-primary" />
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
