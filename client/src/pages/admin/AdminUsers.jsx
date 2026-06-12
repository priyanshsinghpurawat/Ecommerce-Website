import React, { useEffect, useState } from 'react';
import { getAllUsers, updateUserRole } from '../../services/api.js';
import { Loader2, User as UserIcon, Shield, ShoppingBag, Mail, Hash, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      if (res?.success) setUsers(res.data || []);
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
      case 'admin': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'seller': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-surface-100 text-app-text/60 border-surface-200';
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
        <h2 className="text-xl font-bold uppercase tracking-wider text-app-text">User Registry</h2>
        <p className="text-xs text-app-text/50">Manage platform users, roles, and view their activity.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/60 bg-surface-50/40 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/30 text-[10px] font-bold uppercase tracking-wider text-app-text/45">
                <th className="px-5 py-4">User Details</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4 text-center">Total Orders</th>
                <th className="px-5 py-4 text-center">Status/Role</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100/40">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-surface-50/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-surface-100 flex items-center justify-center text-app-text/40 border border-white shadow-sm">
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-app-text">{u.name}</span>
                        <span className="text-[9px] font-mono text-app-text/30 uppercase tracking-tighter">ID: {u._id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-app-text/60">
                        <Mail className="h-3 w-3" />
                        <span>{u.email}</span>
                      </div>
                      {u.phone && (
                        <div className="flex items-center gap-1.5 text-app-text/40">
                          <Hash className="h-3 w-3" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-surface-100 shadow-sm">
                      <ShoppingBag className="h-3 w-3 text-brand-primary" />
                      <span className="font-bold text-app-text">{u.totalOrders || 0}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider border ${getRoleStyle(u.role)}`}>
                      {u.role === 'admin' && <Shield className="h-3 w-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="relative">
                        <select
                          disabled={updatingId === u._id}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="appearance-none bg-surface-50 border border-surface-200 rounded-xl px-3 py-1.5 pr-8 text-[10px] font-bold uppercase tracking-wider text-app-text focus:outline-none focus:border-brand-primary cursor-pointer disabled:opacity-50"
                        >
                          <option value="user">Promote: User</option>
                          <option value="seller">Promote: Seller</option>
                          <option value="admin">Promote: Admin</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-2 h-3 w-3 pointer-events-none text-app-text/40" />
                        {updatingId === u._id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-surface-50/50 rounded-xl">
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
