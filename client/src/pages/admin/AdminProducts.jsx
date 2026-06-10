import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts.js';
import { useCategories } from '../../hooks/useCategories.js';
import { getVendors } from '../../services/user.service.js';
import { Modal } from '../../components/Modal.jsx';
import { DashboardTableSkeleton } from '../../components/Skeleton.jsx';
import { Plus, Edit2, Trash2, Upload, Loader2, Search, ArrowUpDown, ChevronLeft, ChevronRight, Eye, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSubcategories } from '../../services/subcategory.service.js';
import { resolveImageUrl, getDiscountPercent } from '../../utils/imageUrl.js';
import api from '../../services/api.js';

export const AdminProducts = () => {
  const [searchParams] = useSearchParams();
  const sellerId = searchParams.get('seller');

  const { products, pagination, loading, fetchProducts, addProduct, editProduct, removeProduct } = useProducts();
  const { categories, fetchCategories } = useCategories();

  // Vendor assignment state
  const [vendors, setVendors] = useState([]);

  // Modal Control States
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Table filters/search
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('latest');

  // Form States
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    discountedPrice: '',
    category: '',
    subcategory: '',
    seller: '',
    stock: '10',
    badge: '',
    rating: '',
    reviewCount: '',
    colors: [{ name: 'Black', hex: '#000000' }],
    imageUrl: '',
    galleryUrls: ''
  });
  const [subcategories, setSubcategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagesFiles, setImagesFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState('');
  const [imagesPreviews, setImagesPreviews] = useState([]);
  const [existingImage, setExistingImage] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);

  useEffect(() => {
    fetchProducts({ page, limit: 12, search, sort, seller: sellerId });
    fetchCategories();

    // Fetch vendor registry for assignments
    const loadVendors = async () => {
      const res = await getVendors();
      if (res?.success) setVendors(res.data || []);
    };
    loadVendors();
  }, [fetchProducts, fetchCategories, page, search, sort, sellerId]);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (formData.category) {
      const fetchSubcats = async () => {
        const res = await getSubcategories({ category: formData.category });
        if (res?.success) {
          setSubcategories(res.data || []);
        }
      };
      fetchSubcats();
    } else {
      setSubcategories([]);
    }
  }, [formData.category]);

  // Handle direct navigation from Vendor Profile to "Add Product"
  useEffect(() => {
    if (sellerId && vendors.length > 0 && !modalOpen && !isEditing && products.length > 0) {
       // Only auto-open if we haven't already interacted and have vendor data
       // We check products.length to ensure initial load is done
       // handleOpenCreateModal(sellerId); 
    }
  }, [sellerId, vendors, products, modalOpen, isEditing]);

  const handleOpenCreateModal = (preselectedSeller = '') => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      price: '',
      discountedPrice: '',
      category: categories[0]?._id || '',
      subcategory: '',
      seller: preselectedSeller || sellerId || '',
      stock: '10',
      badge: '',
      rating: '',
      reviewCount: '',
      colors: [{ name: 'Black', hex: '#000000' }],
      imageUrl: '',
      galleryUrls: ''
    });
    setImageFile(null);
    setImagesFiles([]);
    setImagePreview('');
    setImagesPreviews([]);
    setExistingImage('');
    setExistingImages([]);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setIsEditing(true);
    setEditingId(product._id);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      discountedPrice: product.discountedPrice || '',
      category: product.category?._id || '',
      subcategory: product.subcategory?._id || '',
      stock: String(product.stock ?? 10),
      badge: product.badge || '',
      rating: product.rating ? String(product.rating) : '',
      reviewCount: product.reviewCount ? String(product.reviewCount) : '',
      colors: product.colors?.length > 0 ? product.colors : [{ name: 'Black', hex: '#000000' }],
      imageUrl: product.image?.startsWith('http') ? product.image : '',
      galleryUrls: product.images?.filter(img => img.startsWith('http')).join(', ') || ''
    });
    setImageFile(null);
    setImagesFiles([]);
    setImagePreview('');
    setImagesPreviews([]);
    setExistingImage(product.image);
    setExistingImages(product.images || []);
    setFormErrors({});
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

  const addColor = () => {
    setFormData({
      ...formData,
      colors: [...formData.colors, { name: 'New Color', hex: '#ffffff' }]
    });
  };

  const removeColor = (index) => {
    const newColors = [...formData.colors];
    newColors.splice(index, 1);
    setFormData({ ...formData, colors: newColors });
  };

  const updateColor = (index, field, value) => {
    const newColors = [...formData.colors];
    newColors[index][field] = value;
    setFormData({ ...formData, colors: newColors });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.price || Number(formData.price) <= 0) {
      errors.price = 'Price must be greater than 0';
    }
    if (formData.discountedPrice && Number(formData.discountedPrice) >= Number(formData.price)) {
      errors.discountedPrice = 'Discounted price must be strictly less than the original price';
    }
    if (formData.discountedPrice && Number(formData.discountedPrice) < 0) {
      errors.discountedPrice = 'Discounted price cannot be negative';
    }
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.subcategory) errors.subcategory = 'Subcategory is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitLoading(true);
    
    // Create multipart FormData
    const data = new FormData();
    data.append('title', formData.title.trim());
    data.append('description', formData.description.trim());
    data.append('price', Number(formData.price));
    data.append('discountedPrice', formData.discountedPrice !== '' ? Number(formData.discountedPrice) : '');
    data.append('category', formData.category);
    data.append('subcategory', formData.subcategory);
    data.append('stock', Number(formData.stock) || 0);
    data.append('badge', formData.badge || '');
    data.append('colors', JSON.stringify(formData.colors));
    if (formData.seller) data.append('seller', formData.seller);

    if (formData.rating !== '') data.append('rating', Number(formData.rating));
    if (formData.reviewCount !== '') data.append('reviewCount', Number(formData.reviewCount));
    
    // Support for Manual URL inputs (only if file is not provided)
    if (formData.imageUrl && !imageFile) {
      data.append('image', formData.imageUrl.trim());
    }
    if (formData.galleryUrls && imagesFiles.length === 0) {
      const urls = formData.galleryUrls.split(',').map(u => u.trim()).filter(Boolean);
      urls.forEach(u => data.append('images', u));
    }
    
    if (imageFile) {
      data.append('image', imageFile);
    }

    if (imagesFiles.length > 0) {
      imagesFiles.forEach(file => {
        data.append('images', file);
      });
    }

    let response;
    if (isEditing) {
      response = await editProduct(editingId, data);
    } else {
      response = await addProduct(data);
    }

    setSubmitLoading(false);

    if (response.success) {
      toast.success(isEditing ? 'Product updated successfully' : 'Product created successfully');
      setModalOpen(false);
      fetchProducts({ page, limit: 12, search, sort });
    } else {
      toast.error(response.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const response = await removeProduct(id);
      if (response.success) {
        toast.success('Product deleted successfully');
        // Refresh products list
        fetchProducts({ page, limit: 12, search, sort });
      } else {
        toast.error(response.error || 'Delete failed');
      }
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file');
      return;
    }

    setCsvUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/products/bulk-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { createdCount, updatedCount, errors } = res.data.data;
      
      toast.success(`Import complete: ${createdCount} created, ${updatedCount} updated.`);
      if (errors && errors.length > 0) {
        console.warn('CSV Import Warnings:', errors);
        toast.error(`${errors.length} rows had errors. Check console.`);
      }
      fetchProducts({ page, limit: 12, search, sort });
    } catch (err) {
      toast.error(err.response?.data?.message || 'CSV Import failed');
    } finally {
      setCsvUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-app-text">Products Catalog</h2>
          <p className="text-xs text-app-text/50">Add, edit, or remove catalog items.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 rounded-2xl border border-brand-primary bg-brand-primary/10 px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-brand-primary hover:bg-brand-primary hover:text-black shadow-soft transition-all duration-300 cursor-pointer">
            {csvUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {csvUploading ? 'Uploading...' : 'Import CSV'}
            <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} disabled={csvUploading} />
          </label>
          <Link
            to="/admin/products/new"
            className="flex items-center gap-2 rounded-2xl bg-app-text px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-app-bg hover:bg-app-text-hover shadow-md transition-all duration-300"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
        
        {/* Search */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search catalog..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-full border border-border-base bg-app-bg px-4 py-2 pl-10 font-sans text-xs text-app-text focus:outline-none focus:border-brand-primary/50"
          />
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-muted" />
        </div>

        {/* Sort */}
        <div className="relative w-full sm:w-48">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="w-full appearance-none rounded-full border border-border-base bg-app-bg px-4 py-2 pr-10 font-sans text-xs text-app-text focus:outline-none focus:border-brand-primary/50"
          >
            <option value="latest">Sort: Latest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="priceAsc">Sort: Price ↑</option>
            <option value="priceDesc">Sort: Price ↓</option>
          </select>
          <ArrowUpDown className="pointer-events-none absolute right-4 top-2.5 h-3.5 w-3.5 text-muted" />
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <DashboardTableSkeleton />
      ) : products.length > 0 ? (
        <div className="overflow-hidden rounded-2xl bg-surface-100 shadow-soft backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border-base bg-app-bg/30 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  <th className="px-6 py-5">Image</th>
                  <th className="px-6 py-5">Title</th>
                  <th className="px-6 py-5">Category</th>
                  <th className="px-6 py-5">Subcategory</th>
                  <th className="px-6 py-5">Price</th>
                  <th className="px-6 py-5">Stock</th>
                  <th className="px-6 py-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base text-xs font-bold text-app-text">
                {products.map((prod) => (
                  <tr key={prod._id} className="hover:bg-app-text/5 transition-all">
                    <td className="px-6 py-5">
                      <img src={resolveImageUrl(prod.image)} alt="" className="h-16 w-16 rounded-xl object-cover bg-surface-200 border border-border-base shadow-md" />
                    </td>
                    <td className="px-6 py-5 truncate max-w-[150px] uppercase tracking-tight italic">{prod.title}</td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 rounded-full bg-app-text/5 border border-border-base text-[9px] text-app-text/60 font-black uppercase tracking-widest">
                        {prod.category?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-muted uppercase tracking-tighter">{prod.subcategory?.name || '—'}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        {prod.discountedPrice !== null && prod.discountedPrice !== undefined ? (
                          <>
                            <span className="text-success font-black italic tracking-tighter">₹{prod.discountedPrice.toFixed(2)}</span>
                            <span className="text-[10px] text-muted line-through tracking-tighter">₹{prod.price.toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="font-black italic tracking-tighter">₹{prod.price.toFixed(2)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`font-black tracking-widest text-[11px] ${prod.stock <= 5 ? 'text-error' : 'text-muted'}`}>
                        {prod.stock}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(prod);
                            setDetailModalOpen(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-app-bg border border-border-base text-app-text hover:bg-app-text hover:text-app-bg transition-all shadow-sm"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <Link
                          to={`/admin/products/${prod._id}/edit`}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-app-bg border border-border-base text-app-text hover:bg-brand-primary hover:text-black transition-all shadow-sm"
                          title="Edit Product"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(prod._id)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-error/10 border border-error/20 text-error hover:bg-error hover:text-black transition-all shadow-sm"
                          title="Delete Product"
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

          {/* Pagination (Auto-shows only when products exceed 12) */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border-base bg-app-bg/30 px-6 py-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={pagination.currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border-base bg-app-bg text-app-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-100 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border-base bg-app-bg text-app-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-100 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-[2rem] border-2 border-dashed border-border-base bg-surface-100 p-12 text-center">
          <p className="font-black uppercase tracking-widest text-[10px] text-muted">No products match your current filters.</p>
        </div>
      )}

      {/* Product Detail Card Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Product Detail Card"
      >
        {selectedProduct && (
          <div className="space-y-6">
            <div className="flex gap-6">
              <img 
                src={resolveImageUrl(selectedProduct.image)} 
                alt={selectedProduct.title}
                className="w-40 h-52 object-cover rounded-2xl shadow-lg bg-surface-50"
              />
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-app-text text-black text-[9px] font-black uppercase tracking-widest">
                      {selectedProduct.category?.name}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-100 text-app-text/60 text-[9px] font-bold uppercase">
                      {selectedProduct.subcategory?.name}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-app-text leading-tight">{selectedProduct.title}</h3>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-black text-app-text">
                    ₹{(selectedProduct.discountedPrice || selectedProduct.price).toLocaleString('en-IN')}
                  </span>
                  {selectedProduct.discountedPrice && (
                    <span className="text-sm text-app-text/40 line-through">
                      ₹{selectedProduct.price.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-app-text">{selectedProduct.rating || '0.0'}</span>
                    <span className="text-xs text-app-text/40">({selectedProduct.reviewCount || 0} reviews)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${selectedProduct.stock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                    {selectedProduct.stock > 0 ? `In Stock (${selectedProduct.stock})` : 'Out of Stock'}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-surface-100">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Description</h4>
              <p className="text-xs text-app-text/70 leading-relaxed italic">
                "{selectedProduct.description}"
              </p>
            </div>

            {selectedProduct.variants && selectedProduct.variants.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-surface-100">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Product Variants</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.variants.map((v, i) => (
                    <span key={i} className="px-2 py-1 bg-surface-100 border border-surface-200 rounded-md text-[10px] font-bold text-app-text uppercase">
                      {v.color || 'No Color'} - {v.size || 'No Size'} (Stock: {v.stock})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-2xl bg-surface-50 border border-surface-100">
                <p className="text-[9px] font-bold uppercase text-app-text/40 mb-1">Badge</p>
                <p className="text-xs font-bold text-app-text uppercase tracking-wider">
                  {selectedProduct.badge || 'No Active Badge'}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-surface-50 border border-surface-100">
                <p className="text-[9px] font-bold uppercase text-app-text/40 mb-1">Pricing Strategy</p>
                <p className="text-xs font-bold text-emerald-600">
                  {selectedProduct.discountedPrice 
                    ? `${getDiscountPercent(selectedProduct.price, selectedProduct.discountedPrice)}% Discount Applied` 
                    : 'Standard Pricing'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                to={`/admin/products/${selectedProduct._id}/edit`}
                onClick={() => setDetailModalOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-app-text py-3 font-sans text-xs font-bold uppercase tracking-wider text-black hover:bg-app-text-hover transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                Edit Product
              </Link>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Product Details' : 'Create Product Entry'}
      >
        <form onSubmit={handleSubmit} className="space-y-2.5">
          
          {/* Title */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-app-text/60">Product Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full rounded-xl border bg-surface-50 px-3 py-2 font-sans text-xs focus:outline-none ${
                formErrors.title ? 'border-red-400 focus:border-red-500' : 'border-surface-200 focus:border-brand-primary'
              }`}
            />
            {formErrors.title && <span className="text-[10px] font-bold text-red-500">{formErrors.title}</span>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-app-text/60">Description</label>
            <textarea
              name="description"
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full rounded-xl border bg-surface-50 px-3 py-2 font-sans text-xs focus:outline-none ${
                formErrors.description ? 'border-red-400 focus:border-red-500' : 'border-surface-200 focus:border-brand-primary'
              }`}
            />
            {formErrors.description && <span className="text-[10px] font-bold text-red-500">{formErrors.description}</span>}
          </div>

          {/* Prices Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-app-text/60">Original Price (₹)</label>
              <input
                type="number"
                name="price"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={`w-full rounded-xl border bg-surface-50 px-3 py-2 font-sans text-xs focus:outline-none ${
                  formErrors.price ? 'border-red-400 focus:border-red-500' : 'border-surface-200 focus:border-brand-primary'
                }`}
              />
              {formErrors.price && <span className="text-[10px] font-bold text-red-500">{formErrors.price}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-app-text/60">Discounted Price (₹)</label>
              <input
                type="number"
                name="discountedPrice"
                step="0.01"
                value={formData.discountedPrice}
                onChange={(e) => setFormData({ ...formData, discountedPrice: e.target.value })}
                className={`w-full rounded-xl border bg-surface-50 px-3 py-2 font-sans text-xs focus:outline-none ${
                  formErrors.discountedPrice ? 'border-red-400 focus:border-red-500' : 'border-surface-200 focus:border-brand-primary'
                }`}
              />
              {formErrors.discountedPrice && <span className="text-[10px] font-bold text-red-500">{formErrors.discountedPrice}</span>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-app-text/60">Stock Quantity</label>
            <input
              type="number"
              name="stock"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 font-sans text-xs focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-app-text/60">Badge</label>
              <select
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-xs"
              >
                <option value="">None</option>
                <option value="new-arrival">New arrival</option>
                <option value="sale">Red hot sale</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-app-text/60">Rating (0–5)</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-app-text/60">Reviews</label>
              <input
                type="number"
                min="0"
                value={formData.reviewCount}
                onChange={(e) => setFormData({ ...formData, reviewCount: e.target.value })}
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-xs"
              />
            </div>
          </div>

          {/* Category Select */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-app-text/60">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                className={`w-full rounded-xl border bg-surface-50 px-3 py-2 font-sans text-xs focus:outline-none ${
                  formErrors.category ? 'border-red-400 focus:border-red-500' : 'border-surface-200 focus:border-brand-primary'
                }`}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              {formErrors.category && <span className="text-[10px] font-bold text-red-500">{formErrors.category}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-app-text/60">Subcategory</label>
              <select
                name="subcategory"
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                disabled={!formData.category}
                className={`w-full rounded-xl border bg-surface-50 px-3 py-2 font-sans text-xs focus:outline-none disabled:opacity-50 ${
                  formErrors.subcategory ? 'border-red-400' : 'border-surface-200 focus:border-brand-primary'
                }`}
              >
                <option value="">Select subcategory</option>
                {subcategories.map((sub) => (
                  <option key={sub._id} value={sub._id}>{sub.name}</option>
                ))}
              </select>
              {formErrors.subcategory && <span className="text-[10px] font-bold text-red-500">{formErrors.subcategory}</span>}
            </div>
          </div>

          {/* Image URL Section */}
          <div className="space-y-2 p-3 rounded-xl bg-app-bg border border-surface-100 shadow-sm">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-app-text/40">Manual Image Links (Optional)</h4>
            <div className="grid grid-cols-1 gap-2">
              <div className="space-y-0.5">
                <label className="text-[8px] font-bold uppercase text-app-text/60">Main URL</label>
                <input
                  type="text"
                  placeholder="Paste URL..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 px-2 py-1.5 text-[10px] focus:outline-none focus:border-brand-primary"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[8px] font-bold uppercase text-app-text/60">Gallery URLs (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="URL 1, URL 2..."
                  value={formData.galleryUrls}
                  onChange={(e) => setFormData({ ...formData, galleryUrls: e.target.value })}
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 px-2 py-1.5 text-[10px] focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>
          </div>

          {/* Image Upload Input */}
          <div className="flex items-start gap-4">
            <div className="space-y-1 flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-app-text/60">Upload Files</label>
              <div className="flex gap-2">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-surface-200 rounded-xl cursor-pointer p-2 hover:bg-surface-50/50 w-20 h-20 transition-colors">
                  <Upload className="h-4 w-4 text-app-text/40" />
                  <span className="text-[8px] font-bold uppercase mt-1">Main</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-surface-200 rounded-xl cursor-pointer p-2 hover:bg-surface-50/50 w-20 h-20 transition-colors">
                  <Upload className="h-4 w-4 text-app-text/40" />
                  <span className="text-[8px] font-bold uppercase mt-1">Gallery</span>
                  <input type="file" accept="image/*" multiple onChange={handleMultipleFilesChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Preview Section */}
            {(imagePreview || existingImage || imagesPreviews.length > 0 || existingImages.length > 0) && (
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-app-text/60">Previews</label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 border border-surface-100 rounded-xl bg-app-bg">
                  {imagePreview ? (
                    <img src={imagePreview} className="h-8 w-8 rounded-md object-cover border border-brand-primary" />
                  ) : existingImage ? (
                    <img src={resolveImageUrl(existingImage)} className="h-8 w-8 rounded-md object-cover border border-surface-200" />
                  ) : null}
                  {imagesPreviews.map((prev, idx) => (
                    <img key={`n-${idx}`} src={prev} className="h-8 w-8 rounded-md object-cover border border-brand-primary" />
                  ))}
                  {existingImages.map((img, idx) => (
                    <img key={`e-${idx}`} src={resolveImageUrl(img)} className="h-8 w-8 rounded-md object-cover border border-surface-200 opacity-50" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Color Management */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-app-text/60">Colors</label>
              <button
                type="button"
                onClick={addColor}
                className="text-[9px] font-black uppercase text-brand-primary hover:underline"
              >
                + Add
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.colors.map((color, idx) => (
                <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-app-bg border border-surface-100 shadow-xs">
                  <select
                    value={color.name}
                    onChange={(e) => updateColor(idx, 'name', e.target.value)}
                    className="w-20 bg-transparent text-[9px] font-bold uppercase outline-none cursor-pointer"
                  >
                    <option value="New Color">Select Color</option>
                    {['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Grey', 'Navy', 'Brown', 'Beige', 'Pink', 'Multi'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <input
                    type="color"
                    value={color.hex}
                    onChange={(e) => updateColor(idx, 'hex', e.target.value)}
                    className="h-4 w-4 rounded cursor-pointer overflow-hidden border-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeColor(idx)}
                    className="text-red-400 hover:text-red-600"
                    disabled={formData.colors.length === 1}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-app-text py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-black hover:bg-app-text-hover transition-colors disabled:opacity-50"
          >
            {submitLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEditing ? (
              'Save Changes'
            ) : (
              'Create Product'
            )}
          </button>

        </form>
      </Modal>

    </div>
  );
};
