import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api.js';
import { ProductGrid } from '../components/ProductGrid.jsx';
import { Loader2, ShieldCheck, MapPin } from 'lucide-react';
import { resolveImageUrl } from '../utils/helpers.js';

export const VendorStore = () => {
  const { slug } = useParams();
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get(`/users/store/${slug}`);
        setStoreData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Store not found');
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [slug]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-brand-primary" /></div>;
  }

  if (error || !storeData) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-app-text">Store Not Found</h2>
        <p className="text-muted">{error}</p>
      </div>
    );
  }

  const { vendor, products } = storeData;
  const storefront = vendor.storefront || {};

  return (
    <div className="min-h-screen bg-app-bg animate-in fade-in duration-700">
      
      {/* 1. Storefront Hero Banner */}
      <div className="relative w-full h-[300px] md:h-[400px] bg-surface-100 overflow-hidden">
        {storefront.banner ? (
          <img 
            src={storefront.banner} 
            alt={`${vendor.brandName} Banner`} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-surface-200 to-app-bg flex items-center justify-center">
            <h1 className="text-6xl font-black text-app-text/10 uppercase tracking-tighter italic">MENSVIBE PARTNER</h1>
          </div>
        )}
        
        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-black/40 bg-gradient-to-t from-app-bg via-transparent to-transparent"></div>
        
        {/* Vendor Profile Picture & Name Overlay */}
        <div className="absolute bottom-0 left-0 w-full p-8 translate-y-1/4">
          <div className="max-w-7xl mx-auto flex items-end gap-6">
            <div className="w-32 h-32 rounded-[2rem] border-4 border-app-bg bg-surface-100 overflow-hidden shadow-2xl flex-shrink-0">
              {vendor.avatar ? (
                <img src={resolveImageUrl(vendor.avatar)} alt={vendor.brandName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand-primary text-black text-4xl font-black uppercase">
                  {(vendor.brandName || 'S')[0]}
                </div>
              )}
            </div>
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic drop-shadow-lg">
                {vendor.brandName || 'Verified Seller'}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-brand-primary bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
                  <ShieldCheck className="h-3 w-3" /> Verified Partner
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for overlapping avatar */}
      <div className="h-16 md:h-20"></div>

      {/* 2. Store Info & Policies */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Left Column: About & Policies */}
        <div className="md:col-span-1 space-y-8">
          {storefront.description && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted border-b border-border-base pb-2">About The Brand</h3>
              <p className="text-sm text-app-text/80 leading-relaxed font-medium">
                {storefront.description}
              </p>
            </div>
          )}

          {storefront.returnPolicy && (
            <div className="bg-surface-100 p-6 rounded-[2rem] border border-border-base space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-primary" /> Store Policy
              </h3>
              <p className="text-xs text-app-text/70 italic leading-relaxed">
                "{storefront.returnPolicy}"
              </p>
            </div>
          )}
          
          <div className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" /> Ships from India
          </div>
        </div>

        {/* Right Column: Products Grid */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-border-base pb-4">
            <h2 className="text-xl font-black uppercase tracking-widest text-app-text italic">
              All <span className="text-brand-primary">Products</span>
            </h2>
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{products.length} Items</span>
          </div>
          
          {products.length > 0 ? (
            <ProductGrid products={products} columns={3} />
          ) : (
            <div className="py-20 text-center">
              <p className="text-muted font-bold text-sm uppercase tracking-widest">This store has no active products.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
