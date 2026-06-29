import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../services/api.js';
import { toast } from 'react-hot-toast';
import { Store, Image as ImageIcon, Save, Loader2 } from 'lucide-react';

export const SellerStorefront = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    brandName: '',
    storefront: {
      banner: '',
      description: '',
      returnPolicy: '',
      slug: ''
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        brandName: user.brandName || '',
        storefront: {
          banner: user.storefront?.banner || '',
          description: user.storefront?.description || '',
          returnPolicy: user.storefront?.returnPolicy || '',
          slug: user.storefront?.slug || ''
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('storefront.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        storefront: {
          ...prev.storefront,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/users/me', formData);
      updateUser(res.data.data);
      toast.success('Storefront updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update storefront');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700 max-w-4xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest text-app-text italic">Storefront <span className="text-brand-primary">Branding</span></h2>
          <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Customize how your brand appears to customers.</p>
        </div>
        {user?.storefront?.slug && (
          <a
            href={`/store/${user.storefront.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-surface-100 text-app-text border border-border-base rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-brand-primary transition-all shadow-sm"
          >
            <Store className="h-3.5 w-3.5" />
            View Live Store
          </a>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Basic Brand Info */}
        <div className="bg-app-card p-8 rounded-[2.5rem] border border-border-base shadow-soft space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-app-text italic mb-2 border-b border-border-base pb-4">Brand Identity</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">Brand Name</label>
              <input
                type="text"
                name="brandName"
                value={formData.brandName}
                onChange={handleChange}
                className="w-full rounded-xl border border-border-base bg-app-bg px-4 py-3 font-sans text-xs text-app-text focus:outline-none focus:border-brand-primary transition-colors"
                placeholder="e.g. Nike"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">Store URL Slug</label>
              <div className="flex items-center">
                <span className="px-4 py-3 rounded-l-xl border border-r-0 border-border-base bg-surface-100 text-muted text-xs font-mono">mensvibe.com/store/</span>
                <input
                  type="text"
                  name="storefront.slug"
                  value={formData.storefront.slug}
                  onChange={handleChange}
                  className="w-full rounded-r-xl border border-border-base bg-app-bg px-4 py-3 font-mono text-xs text-app-text focus:outline-none focus:border-brand-primary transition-colors"
                  placeholder="nike-official"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">Store Description (About Us)</label>
            <textarea
              name="storefront.description"
              value={formData.storefront.description}
              onChange={handleChange}
              rows="4"
              className="w-full rounded-xl border border-border-base bg-app-bg px-4 py-3 font-sans text-xs text-app-text focus:outline-none focus:border-brand-primary transition-colors resize-none"
              placeholder="Tell customers about your brand's mission and quality..."
            />
          </div>
        </div>

        {/* Visuals */}
        <div className="bg-app-card p-8 rounded-[2.5rem] border border-border-base shadow-soft space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-app-text italic mb-2 border-b border-border-base pb-4">Visuals</h3>
          
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">Storefront Banner Image URL</label>
            <div className="flex gap-4">
              <input
                type="url"
                name="storefront.banner"
                value={formData.storefront.banner}
                onChange={handleChange}
                className="flex-1 rounded-xl border border-border-base bg-app-bg px-4 py-3 font-sans text-xs text-app-text focus:outline-none focus:border-brand-primary transition-colors"
                placeholder="https://example.com/banner.jpg"
              />
            </div>
            
            {formData.storefront.banner ? (
              <div className="mt-4 w-full h-48 rounded-2xl overflow-hidden border border-border-base relative group">
                <img src={formData.storefront.banner} alt="Banner Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="mt-4 w-full h-48 rounded-2xl border-2 border-dashed border-border-base bg-surface-100 flex flex-col items-center justify-center text-muted">
                <ImageIcon className="h-8 w-8 mb-2 opacity-20" />
                <span className="text-[10px] font-black uppercase tracking-widest">No Banner Set</span>
              </div>
            )}
          </div>
        </div>

        {/* Policies */}
        <div className="bg-app-card p-8 rounded-[2.5rem] border border-border-base shadow-soft space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-app-text italic mb-2 border-b border-border-base pb-4">Policies</h3>
          
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">Return & Refund Policy</label>
            <textarea
              name="storefront.returnPolicy"
              value={formData.storefront.returnPolicy}
              onChange={handleChange}
              rows="3"
              className="w-full rounded-xl border border-border-base bg-app-bg px-4 py-3 font-sans text-xs text-app-text focus:outline-none focus:border-brand-primary transition-colors resize-none"
              placeholder="e.g. 7-day no questions asked return policy..."
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-brand-primary text-black px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Storefront
          </button>
        </div>

      </form>
    </div>
  );
};
