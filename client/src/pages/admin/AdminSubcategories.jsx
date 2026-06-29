import React, { useEffect, useState } from 'react';
import { useCategories } from '../../hooks/useCategories.js';
import { useSubcategories } from '../../hooks/useSubcategories.js';
import { Modal } from '../../components/Modal.jsx';
import { Plus, Edit2, Trash2, Loader2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Input } from '../../components/Input.jsx';

export const AdminSubcategories = () => {
  const { subcategories, fetchSubcategories, addSubcategory, editSubcategory, removeSubcategory } = useSubcategories();
  const [loading, setLoading] = useState(true);
  const { categories, fetchCategories } = useCategories();
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals Controller
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Input fields
  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await fetchCategories();
      await fetchSubcategories();
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const filteredSubcategories = subcategories.filter(sub => 
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setSelectedCategory('');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (sub) => {
    setIsEditing(true);
    setEditingId(sub._id);
    setName(sub.name);
    setSelectedCategory(sub.category?._id || '');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Subcategory name is required');
      return;
    }
    if (!selectedCategory) {
      setErrorMsg('Parent category is required');
      return;
    }

    setActionLoading(true);
    try {
      if (isEditing) {
        const res = await editSubcategory(editingId, { name: name.trim(), category: selectedCategory });
        if (!res.success) throw new Error(res.error);
        toast.success('Subcategory updated successfully');
      } else {
        const res = await addSubcategory({ name: name.trim(), category: selectedCategory });
        if (!res.success) throw new Error(res.error);
        toast.success('Subcategory created successfully');
      }
      setModalOpen(false);
      fetchAllData();
    } catch (err) {
      toast.error(err?.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (sub) => {
    if (window.confirm(`Are you sure you want to delete subcategory "${sub.name}"?`)) {
      setActionLoading(true);
      try {
        const res = await removeSubcategory(sub._id);
        if (!res.success) throw new Error(res.error);
        toast.success('Subcategory deleted successfully');
        fetchAllData();
      } catch (err) {
        toast.error(err?.message || 'Failed to delete subcategory');
      } finally {
        setActionLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-app-text">Subcategories Registry</h2>
          <p className="text-xs text-app-text/50">Organize your catalog with deeper product groupings.</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 rounded-2xl bg-app-text px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-black hover:bg-app-text-hover shadow-md transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Subcategory
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Filter subcategories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-full border border-surface-200 bg-white/50 px-4 py-2 pl-10 text-xs focus:outline-none focus:border-brand-primary shadow-soft"
        />
        <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-app-text/40" />
      </div>

      {/* Grid Table */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-full bg-surface-100 rounded-xl" />
          <div className="h-40 w-full bg-surface-100/50 rounded-xl" />
        </div>
      ) : filteredSubcategories.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-white/60 bg-surface-50/40 shadow-soft backdrop-blur-md">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/30 text-[10px] font-bold uppercase tracking-wider text-app-text/45">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Parent Category</th>
                <th className="px-6 py-4">Slug Identifier</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100/40 text-xs font-semibold text-app-text">
              {filteredSubcategories.map((sub) => (
                <tr key={sub._id} className="hover:bg-surface-50/20 transition-colors">
                  <td className="px-6 py-4">{sub.name}</td>
                  <td className="px-6 py-4">{sub.category?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 font-mono text-[11px] text-app-text/50">{sub.slug}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(sub)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-100 text-app-text hover:bg-brand-primary hover:text-black transition-all shadow-sm"
                        title="Edit Subcategory"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(sub)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-black transition-all shadow-sm"
                        title="Delete Subcategory"
                        disabled={actionLoading}
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
      ) : (
        <div className="rounded-3xl border border-dashed border-surface-200 bg-surface-50/20 p-12 text-center">
          <p className="font-sans text-xs text-app-text/50">No subcategories registered yet.</p>
        </div>
      )}

      {/* Modal Form */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Rename Subcategory' : 'Create Subcategory'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Subcategory Name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrorMsg('');
            }}
            placeholder="e.g. Sneakers, Jackets"
            error={errorMsg && !name ? errorMsg : null}
          />

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-app-text/60">Parent Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setErrorMsg('');
              }}
              className={`w-full rounded-xl border bg-surface-50 px-3.5 py-2.5 font-sans text-xs focus:outline-none ${
                errorMsg && !selectedCategory ? 'border-red-400 focus:border-red-500' : 'border-surface-200 focus:border-brand-primary'
              }`}
            >
              <option value="">-- Select Category --</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {errorMsg && <p className="text-[10px] font-bold text-red-500">{errorMsg}</p>}

          <button
            type="submit"
            disabled={actionLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-app-text py-3 font-sans text-xs font-bold uppercase tracking-wider text-black hover:bg-app-text-hover transition-colors disabled:opacity-50 mt-4"
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEditing ? (
              'Save Subcategory'
            ) : (
              'Create Subcategory'
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};
