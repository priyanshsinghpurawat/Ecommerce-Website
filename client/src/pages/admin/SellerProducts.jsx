import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { getProducts, deleteProduct } from '../../services/api.js';
import { Plus, Edit2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { resolveImageUrl } from '../../utils/helpers.js';

export const SellerProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
  }, [user]);



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-app-text">My Listings</h2>
          <p className="text-xs text-muted">Manage the products you are selling on MensVibe.</p>
        </div>
        <Link
          to="/seller/products/new"
          className="flex items-center gap-2 rounded-2xl bg-brand-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:opacity-90 shadow-md shadow-brand-primary/20 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-app-text/20" /></div>
      ) : products.length === 0 ? (
        <div className="p-20 text-center border-2 border-dashed border-border-base rounded-[40px]">
          <p className="text-muted font-bold uppercase text-xs">No products listed yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(p => (
            <div key={p._id} className="bg-surface-100 rounded-3xl border border-border-base overflow-hidden shadow-soft group hover:border-brand-primary transition-all">
              <div className="h-48 bg-surface-50 relative overflow-hidden">
                <img src={resolveImageUrl(p.image)} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <Link to={`/seller/products/${p._id}/edit`} className="p-2.5 bg-brand-primary rounded-xl text-black shadow-lg hover:scale-110 active:scale-95 transition-all flex items-center justify-center">
                    <Edit2 className="h-4 w-4 font-black" />
                  </Link>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted">{p.category?.name}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.stock > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {p.stock} in stock
                  </span>
                </div>
                <h3 className="font-bold text-app-text text-sm truncate mb-1">{p.title}</h3>
                
                {p.variants && p.variants.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {p.variants.map((v, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-surface-200 rounded text-[8px] font-bold text-app-text uppercase">
                        {v.color || 'N/A'} - {v.size || 'N/A'}
                      </span>
                    ))}
                  </div>
                )}
                {(!p.variants || p.variants.length === 0) && <div className="mb-3 h-4"></div>}

                <div className="flex items-center justify-between border-t border-border-base pt-3">
                  <span className="font-mono font-black text-app-text">₹{p.price.toLocaleString('en-IN')}</span>
                  <Link
                    to={`/product/${p.slug || p._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-bold uppercase text-brand-primary hover:underline"
                  >
                    View Public ↗
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
