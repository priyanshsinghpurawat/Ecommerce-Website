import React, { useEffect, useState } from 'react';
import { getFrequentlyBoughtTogether } from '../services/product.service.js';
import { ProductCard } from './ProductCard.jsx';
import { Loader2, Sparkles } from 'lucide-react';

export const FrequentlyBoughtTogether = ({ productId, title = "Frequently Bought Together", subtitle = "Complete your look with these compatible items." }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFBT = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        const res = await getFrequentlyBoughtTogether(productId);
        if (res?.success) {
          setProducts(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch FBT products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFBT();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-app-text/45" />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-3.5 w-3.5 text-brand-primary italic" />
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-primary italic">Handpicked Pairings</p>
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight text-app-text">{title}</h2>
        {subtitle && <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-wider mt-1">{subtitle}</p>}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  );
};
