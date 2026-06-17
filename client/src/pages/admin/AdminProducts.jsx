import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts.js';
import { useCategories } from '../../hooks/useCategories.js';
import { getVendors, getSubcategories } from '../../services/api.js';
import { Modal } from '../../components/Modal.jsx';
import { Pagination } from '../../components/Pagination.jsx';
import { DashboardTableSkeleton } from '../../components/Skeleton.jsx';
import { Plus, Edit2, Trash2, Upload, Loader2, Search, ArrowUpDown, Eye, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { resolveImageUrl, getDiscountPercent } from '../../utils/helpers.js';
import api from '../../services/api.js';

export const AdminProducts = () => {
  const [searchParams] = useSearchParams();
  const sellerId = searchParams.get('seller');

  const { products, pagination, loading, fetchProducts, addProduct, editProduct, removeProduct } = useProducts();
  const { categories, fetchCategories } = useCategories();

  // Vendor assignment state
  const [vendors, setVendors] = useState([]);

  // Modal Control States
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Table filters/search
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('latest');

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

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            loading={loading}
          />
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

    </div>
  );
};
