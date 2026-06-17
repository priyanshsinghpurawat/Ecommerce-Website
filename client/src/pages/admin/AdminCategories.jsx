import React, { useEffect, useState } from 'react';
import { useCategories } from '../../hooks/useCategories.js';
import { Modal } from '../../components/Modal.jsx';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Input } from '../../components/Input.jsx';

export const AdminCategories = () => {
  const { categories, loading, fetchCategories, addCategory, editCategory, removeCategory } = useCategories();
  
  // Modals Controller
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Input fields
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setIsEditing(true);
    setEditingId(cat._id);
    setName(cat.name);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Category name is required');
      return;
    }
    if (name.trim().length > 32) {
      setErrorMsg('Category name cannot exceed 32 characters');
      return;
    }

    setActionLoading(true);
    let result;
    if (isEditing) {
      result = await editCategory(editingId, name.trim());
    } else {
      result = await addCategory(name.trim());
    }
    setActionLoading(false);

    if (result.success) {
      toast.success(isEditing ? 'Category updated successfully' : 'Category created successfully');
      setModalOpen(false);
    } else {
      toast.error(result.error || 'Operation failed');
    }
  };

  const handleDelete = async (cat) => {
    if (window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      setActionLoading(true);
      const result = await removeCategory(cat._id);
      setActionLoading(false);

      if (result.success) {
        toast.success('Category deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete category');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-app-text">Categories Registry</h2>
          <p className="text-xs text-app-text/50">Organize and manage catalog products grouping.</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 rounded-2xl bg-app-text px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-black hover:bg-app-text-hover shadow-md transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Categories Grid Table */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-full bg-surface-100 rounded-xl" />
          <div className="h-40 w-full bg-surface-100/50 rounded-xl" />
        </div>
      ) : categories.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-white/60 bg-surface-50/40 shadow-soft backdrop-blur-md">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/30 text-[10px] font-bold uppercase tracking-wider text-app-text/45">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Slug Identifier</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100/40 text-xs font-semibold text-app-text">
              {categories.map((cat) => (
                <tr key={cat._id} className="hover:bg-surface-50/20 transition-colors">
                  <td className="px-6 py-4">{cat.name}</td>
                  <td className="px-6 py-4 font-mono text-[11px] text-app-text/50">{cat.slug}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(cat)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-100 text-app-text hover:bg-brand-primary hover:text-black transition-all shadow-sm"
                        title="Edit Category"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-black transition-all shadow-sm"
                        title="Delete Category"
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
          <p className="font-sans text-xs text-app-text/50">No categories registered in database yet.</p>
        </div>
      )}

      {/* Category Modal Form */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Rename Category' : 'Create Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrorMsg('');
            }}
            placeholder="e.g. Living Room, Essentials"
            error={errorMsg}
          />

          <button
            type="submit"
            disabled={actionLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-app-text py-3 font-sans text-xs font-bold uppercase tracking-wider text-black hover:bg-app-text-hover transition-colors disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEditing ? (
              'Save Category'
            ) : (
              'Create Category'
            )}
          </button>
        </form>
      </Modal>

    </div>
  );
};
