import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/product.service.js';
import { useCategories } from '../../hooks/useCategories.js';
import { Modal } from '../../components/Modal.jsx';
import { Plus, Edit2, Trash2, Upload, Loader2, Search, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSubcategories } from '../../services/subcategory.service.js';
import { resolveImageUrl } from '../../utils/imageUrl.js';

export const SellerProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { categories, fetchCategories } = useCategories();
  const [subcategories, setSubcategories] = useState([]);
  
  // Modal states (same as AdminProducts)
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    discountedPrice: '',
    category: '',
    subcategory: '',
    stock: '10',
    gender: 'men',
    badge: '',
    rating: '',
    reviewCount: '',
    colors: [{ name: 'Default', hex: '#000000' }],
    imageUrl: '',
    galleryUrls: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagesFiles, setImagesFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState('');
  const [imagesPreviews, setImagesPreviews] = useState([]);
  const [existingImage, setExistingImage] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchMyProducts = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const res = await getProducts({ seller: user._id, limit: 100 });
      setProducts(res.data?.products || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProducts();
    fetchCategories();
  }, [user]);

  useEffect(() => {
    const load = async () => {
      if (!formData.category) {
        setSubcategories([]);
        return;
      }
      const res = await getSubcategories(formData.category);
      setSubcategories(res?.data || []);
    };
    if (modalOpen) load();
  }, [formData.category, modalOpen]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      price: '',
      discountedPrice: '',
      category: categories[0]?._id || '',
      subcategory: '',
      stock: '10',
      gender: 'men',
      badge: '',
      rating: '',
      reviewCount: '',
      colors: [{ name: 'Default', hex: '#000000' }],
      imageUrl: '',
      galleryUrls: ''
    });
    setImageFile(null);
    setImagesFiles([]);
    setImagePreview('');
    setImagesPreviews([]);
    setExistingImage('');
    setExistingImages([]);
    setModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setIsEditing(true);
    setEditingId(p._id);
    setFormData({
      title: p.title,
      description: p.description,
      price: p.price.toString(),
      discountedPrice: p.discountedPrice ? p.discountedPrice.toString() : '',
      category: p.category?._id || '',
      subcategory: p.subcategory?._id || '',
      stock: p.stock.toString(),
      gender: p.gender || 'men',
      badge: p.badge || '',
      rating: p.rating ? p.rating.toString() : '',
      reviewCount: p.reviewCount ? p.reviewCount.toString() : '',
      colors: p.colors?.length > 0 ? p.colors : [{ name: 'Default', hex: '#000000' }],
      imageUrl: p.image?.startsWith('http') ? p.image : '',
      galleryUrls: p.images?.filter(img => img.startsWith('http')).join(', ') || ''
    });
    setImageFile(null);
    setImagesFiles([]);
    setImagePreview('');
    setImagesPreviews([]);
    setExistingImage(p.image);
    setExistingImages(p.images || []);
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleMultipleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImagesFiles(files);
      const previews = files.map(file => URL.createObjectURL(file));
      setImagesPreviews(previews);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    const data = new FormData();
    data.append('title', formData.title.trim());
    data.append('description', formData.description.trim());
    data.append('price', Number(formData.price));
    data.append('discountedPrice', formData.discountedPrice !== '' ? Number(formData.discountedPrice) : '');
    data.append('category', formData.category);
    data.append('subcategory', formData.subcategory);
    data.append('stock', Number(formData.stock) || 0);
    data.append('gender', formData.gender);
    data.append('badge', formData.badge);
    data.append('colors', JSON.stringify(formData.colors));
    data.append('seller', user._id);

    if (formData.rating !== '') data.append('rating', Number(formData.rating));
    if (formData.reviewCount !== '') data.append('reviewCount', Number(formData.reviewCount));

    // Support for Manual URL inputs
    if (formData.imageUrl && !imageFile) {
      data.append('image', formData.imageUrl.trim());
    }
    if (formData.galleryUrls && imagesFiles.length === 0) {
      const urls = formData.galleryUrls.split(',').map(u => u.trim()).filter(Boolean);
      urls.forEach(u => data.append('images', u));
    }

    if (imageFile) data.append('image', imageFile);
    if (imagesFiles.length > 0) {
      imagesFiles.forEach(file => data.append('images', file));
    }

    try {
      let res;
      if (isEditing) {
        res = await updateProduct(editingId, data);
      } else {
        res = await createProduct(data);
      }

      if (res.success) {
        toast.success(isEditing ? 'Product updated' : 'Product launched successfully');
        setModalOpen(false);
        fetchMyProducts();
      } else {
        toast.error(res.message || 'Operation failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authorization or network failure (403/500)');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-lux-dark">My Listings</h2>
          <p className="text-xs text-muted">Manage the products you are selling on MensVibe.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/seller/products/new" className="flex items-center gap-2 rounded-2xl bg-lux-dark px-4 py-2.5 text-xs font-bold uppercase text-lux-bg hover:bg-lux-dark-hover shadow-md">
            <Plus className="h-4 w-4" /> Add New
          </Link>
          <button onClick={handleOpenCreateModal} className="hidden md:flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold uppercase text-lux-dark hover:bg-lux-100 shadow-soft" title="Quick add (legacy)">
            Quick add
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-lux-dark/20" /></div>
      ) : products.length === 0 ? (
        <div className="p-20 text-center border-2 border-dashed border-border-base rounded-[40px]">
          <p className="text-muted font-bold uppercase text-xs">No products listed yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(p => (
            <div key={p._id} className="bg-lux-100 rounded-3xl border border-border-base overflow-hidden shadow-soft group hover:border-lux-primary transition-all">
              <div className="h-48 bg-lux-50 relative overflow-hidden">
                <img src={resolveImageUrl(p.image)} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button onClick={() => handleOpenEditModal(p)} className="p-2 bg-lux-100/90 backdrop-blur-md rounded-xl text-lux-dark hover:bg-lux-primary hover:text-black shadow-sm transition-all">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted">{p.category?.name}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.stock > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {p.stock} in stock
                  </span>
                </div>
                <h3 className="font-bold text-lux-dark text-sm truncate mb-3">{p.title}</h3>
                <div className="flex items-center justify-between border-t border-border-base pt-3">
                  <span className="font-mono font-black text-lux-dark">₹{p.price.toLocaleString('en-IN')}</span>
                  <button className="text-[10px] font-bold uppercase text-lux-primary hover:underline">View Public</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={isEditing ? 'Edit Listing' : 'Launch New Product'}>
         <form onSubmit={handleSubmit} className="space-y-5 max-h-[80vh] overflow-y-auto px-1 custom-scrollbar">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-lux-dark/40">Product Title</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Premium Cotton Oversized Tee" className="w-full rounded-2xl border border-border-base bg-lux-50 px-4 py-3 text-xs focus:outline-none focus:border-lux-primary text-lux-dark font-bold" required />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-lux-dark/40">Description</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe your product materials, fit, and style..." className="w-full h-24 rounded-2xl border border-border-base bg-lux-50 px-4 py-3 text-xs focus:outline-none focus:border-lux-primary text-lux-dark font-medium leading-relaxed resize-none" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-lux-dark/40">Price (₹)</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full rounded-2xl border border-border-base bg-lux-50 px-4 py-3 text-xs focus:outline-none focus:border-lux-primary text-lux-dark font-black" required />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-lux-dark/40">Discounted (₹)</label>
                  <input type="number" value={formData.discountedPrice} onChange={e => setFormData({...formData, discountedPrice: e.target.value})} placeholder="Optional" className="w-full rounded-2xl border border-border-base bg-lux-50 px-4 py-3 text-xs focus:outline-none focus:border-lux-primary text-lux-dark font-black" />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-lux-dark/40">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full rounded-2xl border border-border-base bg-lux-50 px-4 py-3 text-xs focus:outline-none focus:border-lux-primary text-lux-dark font-bold" required>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-lux-dark/40">Stock Status</label>
                  <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full rounded-2xl border border-border-base bg-lux-50 px-4 py-3 text-xs focus:outline-none focus:border-lux-primary text-lux-dark font-black" required />
               </div>
            </div>

            {/* Manual Links - Resolves 403 issues for some external URLs */}
            <div className="p-4 rounded-2xl bg-lux-bg border border-lux-200/50 space-y-3">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-lux-primary">Manual Image Links (Gallery)</h4>
              <div className="space-y-2">
                <input type="text" placeholder="Main Image URL..." value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full rounded-xl border border-border-base bg-lux-50 px-3 py-2 text-[10px] focus:outline-none focus:border-lux-primary" />
                <input type="text" placeholder="Gallery URLs (comma separated)..." value={formData.galleryUrls} onChange={e => setFormData({...formData, galleryUrls: e.target.value})} className="w-full rounded-xl border border-border-base bg-lux-50 px-3 py-2 text-[10px] focus:outline-none focus:border-lux-primary" />
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-lux-dark/40">Upload New Media</label>
                <div className="flex gap-2">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border-base rounded-2xl cursor-pointer p-3 hover:bg-lux-primary/5 hover:border-lux-primary w-24 h-24 transition-all">
                    <Upload className="h-5 w-5 text-lux-dark/20" />
                    <span className="text-[8px] font-black uppercase mt-1">Hero</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border-base rounded-2xl cursor-pointer p-3 hover:bg-lux-primary/5 hover:border-lux-primary w-24 h-24 transition-all">
                    <Upload className="h-5 w-5 text-lux-dark/20" />
                    <span className="text-[8px] font-black uppercase mt-1">Gallery</span>
                    <input type="file" accept="image/*" multiple onChange={handleMultipleFilesChange} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Enhanced Preview Logic */}
              {(imagePreview || existingImage || imagesPreviews.length > 0 || existingImages.length > 0) && (
                <div className="flex-1 space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-lux-dark/40">Live Previews</label>
                   <div className="flex flex-wrap gap-1.5 p-2 rounded-2xl border border-border-base bg-lux-50 max-h-24 overflow-y-auto">
                      {imagePreview ? (
                        <img src={imagePreview} className="h-10 w-10 rounded-lg object-cover border-2 border-lux-primary shadow-sm" />
                      ) : existingImage ? (
                        <img src={resolveImageUrl(existingImage)} className="h-10 w-10 rounded-lg object-cover border border-border-base opacity-60" />
                      ) : null}
                      {imagesPreviews.map((prev, idx) => (
                        <img key={idx} src={prev} className="h-10 w-10 rounded-lg object-cover border-2 border-lux-primary shadow-sm" />
                      ))}
                      {existingImages.map((img, idx) => (
                        <img key={`e-${idx}`} src={resolveImageUrl(img)} className="h-10 w-10 rounded-lg object-cover border border-border-base opacity-40" />
                      ))}
                   </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={submitLoading} className="w-full py-4 bg-lux-dark text-lux-bg font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-lux-primary hover:text-black transition-all shadow-xl disabled:opacity-50 active:scale-[0.98]">
               {submitLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (isEditing ? 'Sync Changes' : 'Launch Collection Entry')}
            </button>
         </form>
      </Modal>
    </div>
  );
};
