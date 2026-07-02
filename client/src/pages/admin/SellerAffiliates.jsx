import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { getProducts } from '../../services/product.service.js';
import api from '../../services/api.js';
import { toast } from 'react-hot-toast';
import { Link2, Copy, BarChart3, TrendingUp, Plus, Loader2, Download, Trash2 } from 'lucide-react';

export const SellerAffiliates = () => {
  const { user } = useAuth();
  const [links, setLinks] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  const fetchAffiliateData = async () => {
    try {
      const [linksRes, productsRes] = await Promise.all([
        api.get('/affiliates'),
        getProducts({ seller: user._id, limit: 100 })
      ]);
      setLinks(linksRes.data?.data || []);
      setProducts(productsRes.data?.products || []);
    } catch (error) {
      toast.error('Failed to load affiliate data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliateData();
  }, []);

  const handleGenerateLink = async (e) => {
    e.preventDefault();
    if (!campaignName) return toast.error('Campaign name is required');
    
    setIsGenerating(true);
    try {
      const res = await api.post('/affiliates/generate', {
        campaignName,
        productId: selectedProductId || null
      });
      toast.success('Link generated successfully!');
      setLinks([res.data.data, ...links]);
      setCampaignName('');
      setSelectedProductId('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (url) => {
    // Generate the full absolute URL
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('Copied to clipboard!');
  };

  const handleDeleteLink = async (id) => {
    if (!window.confirm('Are you sure you want to delete this affiliate link?')) return;
    
    try {
      await api.delete(`/affiliates/${id}`);
      setLinks(links.filter(link => link._id !== id));
      toast.success('Link deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete link');
    }
  };

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-brand-primary" /></div>;
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest text-app-text italic">Affiliate <span className="text-brand-primary">Marketing</span></h2>
          <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Generate trackable links to measure your external campaigns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Link Generator Form */}
        <div className="bg-app-card p-8 rounded-[2.5rem] border border-border-base shadow-soft h-fit">
          <h3 className="text-xs font-black uppercase tracking-widest text-app-text italic mb-6">Create New Link</h3>
          <form onSubmit={handleGenerateLink} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">Campaign Name (e.g. IG-Story-Summer)</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full rounded-xl border border-border-base bg-app-bg px-4 py-3 font-sans text-xs text-app-text focus:outline-none focus:border-brand-primary transition-colors"
                placeholder="Campaign identifier..."
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">Target Product (Optional)</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-border-base bg-app-bg px-4 py-3 font-sans text-xs text-app-text focus:outline-none focus:border-brand-primary transition-colors"
              >
                <option value="">Storefront (General Link)</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.title}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-brand-primary text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-md disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Generate Link
            </button>
          </form>
        </div>

        {/* Links List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-app-text italic">Active Campaigns</h3>
          
          {links.length === 0 ? (
            <div className="bg-app-card p-12 rounded-[2.5rem] border border-border-base border-dashed text-center">
              <Link2 className="h-10 w-10 mx-auto text-muted mb-3 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">No affiliate links generated yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {links.map((link) => (
                <div key={link._id} className="bg-app-card p-6 rounded-[2rem] border border-border-base shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-brand-primary/30 transition-colors">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-sm font-black text-app-text uppercase tracking-tight italic">{link.campaignName}</h4>
                      <span className="px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary text-[8px] font-black uppercase tracking-widest border border-brand-primary/20">
                        {link.targetProduct ? 'Product Link' : 'Storefront Link'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-mono text-muted bg-app-bg px-3 py-1.5 rounded-lg border border-border-base truncate max-w-[200px] sm:max-w-[300px]">
                        {window.location.origin}{link.targetUrl}
                      </p>
                      <button
                        onClick={() => handleCopy(link.targetUrl)}
                        className="p-1.5 rounded-lg bg-app-text text-app-bg hover:scale-105 transition-transform"
                        title="Copy Link"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteLink(link._id)}
                        className="p-1.5 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors"
                        title="Delete Link"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 md:border-l border-border-base md:pl-6">
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 flex items-center justify-center gap-1">
                        <BarChart3 className="h-3 w-3" /> Clicks
                      </p>
                      <p className="text-xl font-black italic tracking-tighter text-app-text">{link.metrics?.clicks || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 flex items-center justify-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Conv.
                      </p>
                      <p className="text-xl font-black italic tracking-tighter text-success">{link.metrics?.conversions || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
