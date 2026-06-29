import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Package, ImageIcon, Layers, Eye, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import ImageDropzone from '../../components/admin/ImageDropzone.jsx';
import VariantEditor from '../../components/admin/VariantEditor.jsx';
import VariantDataTable from '../../components/admin/VariantDataTable.jsx';
import VariantGeneratorModal from '../../components/admin/VariantGeneratorModal.jsx';
import { useCategories } from '../../hooks/useCategories.js';
import { useSubcategories } from '../../hooks/useSubcategories.js';
import * as productService from '../../services/product.service.js';
import { makeRemoteItem, getDiscountPercent } from '../../utils/helpers.js';

// Feature flag: toggle to true to use new variant UI
const NEW_VARIANT_UI_ENABLED = true;

const productSchema = z.object({
  title: z.string().trim().min(2, 'Title too short').max(120),
  description: z.string().trim().min(10, 'Description too short'),
  price: z.coerce.number().positive('Price must be > 0'),
  discountedPrice: z.union([z.literal(''), z.coerce.number().nonnegative()]).optional(),
  category: z.string().min(1, 'Pick a category'),
  subcategory: z.string().min(1, 'Pick a subcategory'),
  gender: z.enum(['men', 'women', 'unisex']).default('men'),
  stock: z.coerce.number().int().nonnegative().default(10),
  badge: z.enum(['', 'new-arrival', 'sale', 'street-drip']).default('')
});

const STEPS = [
  { id: 'basics',   label: 'Basics',   icon: Package },
  { id: 'gallery',  label: 'Gallery',  icon: ImageIcon },
  { id: 'variants', label: 'Variants', icon: Layers },
  { id: 'review',   label: 'Review',   icon: Eye },
];

const BADGE_COLORS = {
  'new-arrival': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'sale':        'bg-red-500/20 text-red-400 border-red-500/30',
  'street-drip': 'bg-brand-primary/20 text-brand-primary border-brand-primary/30',
};

export default function AddEditProduct() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { categories, fetchCategories } = useCategories();
  const { subcategories, fetchSubcategories } = useSubcategories();

  const [gallery, setGallery] = useState([]);
  const [variants, setVariants] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [activeStep, setActiveStep] = useState(0);
  const [showGenerator, setShowGenerator] = useState(false);

  const {
    register, handleSubmit, watch, setValue, reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: { gender: 'men', stock: 10, badge: '', discountedPrice: '' }
  });

  const watchedCategory = watch('category');
  const watched = watch();

  useEffect(() => { if (!categories?.length) fetchCategories(); }, [categories?.length, fetchCategories]);
  useEffect(() => { fetchSubcategories(); }, [fetchSubcategories]);

  const filteredSubcategories = useMemo(() => {
    if (!watchedCategory) return [];
    return subcategories.filter(sub => {
      const parentId = typeof sub.category === 'object' ? sub.category?._id : sub.category;
      return parentId === watchedCategory;
    });
  }, [subcategories, watchedCategory]);

  useEffect(() => {
    if (!isEdit) return;
    let cancel = false;
    productService.getProductById(id).then(async (res) => {
      if (cancel) return;
      const p = res.data;
      reset({
        title: p.title || '',
        description: p.description || '',
        price: p.price || 0,
        discountedPrice: p.discountedPrice ?? '',
        category: p.category?._id || p.category || '',
        subcategory: p.subcategory?._id || p.subcategory || '',
        gender: p.gender || 'men',
        stock: p.stock ?? 10,
        badge: p.badge || ''
      });
      const galleryUrls = [
        ...(p.image && !(p.images || []).includes(p.image) ? [p.image] : []),
        ...(p.images || [])
      ];
      setGallery(galleryUrls.map(makeRemoteItem));

      // Load standalone variants if feature flag is on
      let variantsData = p.variants || [];
      if (NEW_VARIANT_UI_ENABLED && p._id) {
        try {
          const variantsRes = await productService.getProductVariants(p._id);
          if (variantsRes?.data?.length) {
            variantsData = variantsRes.data.map(v => ({
              color: v.optionValues?.Color || '',
              size: v.optionValues?.Size || '',
              sku: v.sku || '',
              stock: v.stock ?? 0,
              price: v.price ?? '',
              images: (v.images || []).map(makeRemoteItem),
              variantId: v._id
            }));
          }
        } catch {
          // Fallback to embedded variants
          variantsData = (p.variants || []).map(v => ({
            color: v.color || '',
            size: v.size || '',
            sku: v.sku || '',
            stock: v.stock ?? 0,
            price: v.price ?? '',
            images: (v.images || []).map(makeRemoteItem)
          }));
        }
      } else {
        variantsData = (p.variants || []).map(v => ({
          color: v.color || '',
          size: v.size || '',
          sku: v.sku || '',
          stock: v.stock ?? 0,
          price: v.price ?? '',
          images: (v.images || []).map(makeRemoteItem)
        }));
      }
      setVariants(variantsData);
      setLoading(false);
    }).catch((e) => {
      toast.error(e.response?.data?.message || 'Failed to load product');
      navigate(-1);
    });
    return () => { cancel = true; };
  }, [id, isEdit, reset, navigate]);

  const onSubmit = async (values) => {
    if (gallery.length === 0) {
      toast.error('Add at least one product image');
      setActiveStep(1);
      return;
    }
    setSubmitting(true);

    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      fd.append(k, String(v));
    });

    const keepGallery = [];
    gallery.forEach((i, idx) => {
      if (idx === 0) {
        if (i.kind === 'remote') fd.append('existingCover', i.url);
        else fd.append('cover', i.file);
      } else {
        if (i.kind === 'remote') keepGallery.push(i.url);
        else fd.append('gallery', i.file);
      }
    });
    fd.append('existingImages', JSON.stringify(keepGallery));

    const variantsMeta = variants.map((v) => ({
      color: v.color, size: v.size, sku: v.sku,
      stock: Number(v.stock) || 0,
      price: v.price === '' ? null : Number(v.price),
      keepImages: v.images.filter((i) => i.kind === 'remote').map((i) => i.url)
    }));
    fd.append('variantsMeta', JSON.stringify(variantsMeta));
    variants.forEach((v, i) => {
      v.images.filter((it) => it.kind === 'file').forEach((it) => {
        fd.append(`variant_${i}_images`, it.file);
      });
    });

    try {
      if (isEdit) await productService.updateProduct(id, fd);
      else await productService.createProduct(fd);
      toast.success(isEdit ? 'Product updated!' : 'Product created!');
      navigate(-1);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const preview = useMemo(() => ({
    title: watched.title || 'Your product title',
    price: watched.price || 0,
    discountedPrice: watched.discountedPrice || null,
    cover: gallery[0]?.previewUrl,
    badge: watched.badge,
    stock: watched.stock,
    variants: variants.length,
    images: gallery.length,
  }), [watched, gallery, variants]);

  const discountPct = preview.discountedPrice && preview.price > 0
    ? Math.round((1 - preview.discountedPrice / preview.price) * 100)
    : 0;

  const inputCls = 'mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-app-bg text-app-text text-sm focus:outline-none focus:border-brand-primary transition-colors placeholder:text-muted/50';
  const labelCls = 'text-[11px] font-black uppercase tracking-[0.15em] text-muted';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-7 h-7 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto px-4 py-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to=".." className="p-2.5 rounded-xl border border-border hover:bg-app-panel transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-xs text-muted mt-0.5">
            {isEdit ? 'Update your listing details, gallery and variants.' : 'Fill in the basics, upload photos, then optionally add variants.'}
          </p>
        </div>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < activeStep;
          const active = i === activeStep;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveStep(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 border transition-all ${
                active
                  ? 'bg-brand-primary text-black border-brand-primary shadow-md shadow-brand-primary/20'
                  : done
                  ? 'bg-app-panel border-brand-primary/30 text-brand-primary'
                  : 'bg-app-panel border-border text-muted hover:border-app-text/40'
              }`}
            >
              {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              {s.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">

          {/* ─── STEP 0: Basics ─── */}
          <AnimatePresence mode="wait">
            {activeStep === 0 && (
              <motion.section
                key="basics"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-app-card border border-border rounded-2xl p-6 space-y-5 shadow-soft"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-brand-primary" />
                  <h2 className="font-black uppercase tracking-wider text-sm">Product Basics</h2>
                </div>

                <div>
                  <label className={labelCls}>Product Title</label>
                  <input
                    {...register('title')}
                    placeholder="e.g. Premium Oversized Acid-Wash Tee"
                    className={inputCls}
                  />
                  {errors.title && <p className="text-xs text-error mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    rows={4}
                    {...register('description')}
                    placeholder="Describe the material, fit, style and any special features..."
                    className={`${inputCls} resize-none`}
                  />
                  {errors.description && <p className="text-xs text-error mt-1">{errors.description.message}</p>}
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className={labelCls}>Price (₹)</label>
                    <input type="number" step="0.01" placeholder="999" {...register('price')} className={inputCls} />
                    {errors.price && <p className="text-xs text-error mt-1">{errors.price.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Sale Price (₹)</label>
                    <input type="number" step="0.01" placeholder="Optional" {...register('discountedPrice')} className={inputCls} />
                    {discountPct > 0 && (
                      <p className="text-[10px] text-emerald-400 font-bold mt-1">↓ {discountPct}% off</p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Stock</label>
                    <input type="number" placeholder="10" {...register('stock')} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Badge</label>
                    <select {...register('badge')} className={inputCls}>
                      <option value="">— None —</option>
                      <option value="new-arrival">🆕 New Arrival</option>
                      <option value="sale">🔥 Sale</option>
                      <option value="street-drip">💧 Street Drip</option>
                    </select>
                  </div>
                </div>

                {/* Taxonomy */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Category</label>
                    <select {...register('category')} className={inputCls}>
                      <option value="">Select category</option>
                      {categories?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                    {errors.category && <p className="text-xs text-error mt-1">{errors.category.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Subcategory</label>
                    <select {...register('subcategory')} className={inputCls} disabled={!watchedCategory}>
                      <option value="">Select subcategory</option>
                      {filteredSubcategories.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                    {errors.subcategory && <p className="text-xs text-error mt-1">{errors.subcategory.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Gender</label>
                    <select {...register('gender')} className={inputCls}>
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="px-6 py-2.5 bg-brand-primary text-black text-xs font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all"
                  >
                    Next: Gallery →
                  </button>
                </div>
              </motion.section>
            )}

            {/* ─── STEP 1: Gallery ─── */}
            {activeStep === 1 && (
              <motion.section
                key="gallery"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-app-card border border-border rounded-2xl p-6 space-y-4 shadow-soft"
              >
                <div className="flex items-center gap-2 mb-1">
                  <ImageIcon className="w-4 h-4 text-brand-primary" />
                  <h2 className="font-black uppercase tracking-wider text-sm">Product Gallery</h2>
                </div>
                <p className="text-xs text-muted -mt-2">
                  First image becomes the cover. Drag thumbnails to reorder. Upload up to 10 images.
                </p>
                <ImageDropzone value={gallery} onChange={setGallery} maxFiles={10} />

                <div className="flex justify-between pt-2">
                  <button type="button" onClick={() => setActiveStep(0)} className="px-5 py-2.5 border border-border rounded-xl text-xs font-bold uppercase hover:bg-app-panel transition-all">
                    ← Back
                  </button>
                  <button type="button" onClick={() => setActiveStep(2)} className="px-6 py-2.5 bg-brand-primary text-black text-xs font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all">
                    Next: Variants →
                  </button>
                </div>
              </motion.section>
            )}

            {/* ─── STEP 2: Variants ─── */}
            {activeStep === 2 && (
              <motion.section
                key="variants"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-app-card border border-border rounded-2xl p-6 shadow-soft"
              >
                {NEW_VARIANT_UI_ENABLED ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-black uppercase tracking-wider text-sm">Variants</h3>
                        <p className="text-[11px] text-muted mt-0.5">
                          {variants.length} variant{variants.length !== 1 ? 's' : ''} · Use the generator or add rows manually.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowGenerator(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-primary/30 bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase tracking-wider hover:bg-brand-primary/20 transition-all"
                      >
                        ⚡ Generator
                      </button>
                    </div>
                    <VariantDataTable
                      value={variants}
                      onChange={setVariants}
                      onDelete={(variantId) => productService.deleteVariant(variantId).catch(() => {})}
                      categoryName={categories?.find(c => c._id === watchedCategory)?.name || ''}
                    />
                  </>
                ) : (
                  <VariantEditor
                    value={variants}
                    onChange={setVariants}
                    categoryName={categories?.find(c => c._id === watchedCategory)?.name || ''}
                  />
                )}

                <div className="flex justify-between pt-4 mt-4 border-t border-border">
                  <button type="button" onClick={() => setActiveStep(1)} className="px-5 py-2.5 border border-border rounded-xl text-xs font-bold uppercase hover:bg-app-panel transition-all">
                    ← Back
                  </button>
                  <button type="button" onClick={() => setActiveStep(3)} className="px-6 py-2.5 bg-brand-primary text-black text-xs font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all">
                    Review & Publish →
                  </button>
                </div>

                {NEW_VARIANT_UI_ENABLED && (
                  <VariantGeneratorModal
                    isOpen={showGenerator}
                    onClose={() => setShowGenerator(false)}
                    onGenerate={(newVariants) => setVariants(prev => [...prev, ...newVariants])}
                    productCode={watched.title ? watched.title.substring(0, 3).toUpperCase().replace(/\s+/g, '') : 'PROD'}
                    categoryName={categories?.find(c => c._id === watchedCategory)?.name || ''}
                  />
                )}
              </motion.section>
            )}

            {/* ─── STEP 3: Review ─── */}
            {activeStep === 3 && (
              <motion.section
                key="review"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-app-card border border-border rounded-2xl p-6 space-y-5 shadow-soft"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-brand-primary" />
                  <h2 className="font-black uppercase tracking-wider text-sm">Review Summary</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Title',      val: watched.title || '—' },
                    { label: 'Price',      val: watched.price ? `₹${watched.price}` : '—' },
                    { label: 'Sale Price', val: watched.discountedPrice ? `₹${watched.discountedPrice}` : 'None' },
                    { label: 'Stock',      val: watched.stock ?? 10 },
                    { label: 'Gender',     val: watched.gender || '—' },
                    { label: 'Badge',      val: watched.badge || 'None' },
                    { label: 'Images',     val: `${gallery.length} uploaded` },
                    { label: 'Variants',   val: `${variants.length} added` },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-app-panel rounded-xl p-3 border border-border">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted">{label}</p>
                      <p className="text-sm font-bold text-app-text mt-0.5 truncate">{String(val)}</p>
                    </div>
                  ))}
                </div>

                {gallery.length === 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                    ⚠️ No images uploaded — go back and add at least one.
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <button type="button" onClick={() => setActiveStep(2)} className="px-5 py-2.5 border border-border rounded-xl text-xs font-bold uppercase hover:bg-app-panel transition-all">
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || gallery.length === 0}
                    className="inline-flex items-center gap-2 px-8 py-2.5 bg-brand-primary text-black text-xs font-black uppercase tracking-widest rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-brand-primary/20"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isEdit ? 'Save Changes' : 'Publish Product'}
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Sticky Preview ─── */}
        <aside className="space-y-4 lg:sticky lg:top-20 self-start">
          <div className="bg-app-card border border-border rounded-2xl overflow-hidden shadow-soft">
            <div className="aspect-[4/5] bg-app-panel relative">
              {preview.cover ? (
                <img src={preview.cover} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted">
                  <ImageIcon className="w-10 h-10 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-40">Cover preview</p>
                </div>
              )}
              {preview.badge && (
                <span className={`absolute top-3 left-3 text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg font-black border ${BADGE_COLORS[preview.badge] || ''}`}>
                  {preview.badge.replace('-', ' ')}
                </span>
              )}
              {gallery.length > 1 && (
                <span className="absolute bottom-3 right-3 text-[9px] bg-black/60 text-white px-2 py-1 rounded-lg font-bold">
                  1 / {gallery.length}
                </span>
              )}
            </div>
            <div className="p-4 space-y-1.5">
              <p className="text-sm font-black line-clamp-1 text-app-text">{preview.title}</p>
              <div className="flex items-baseline gap-2">
                {preview.discountedPrice ? (
                  <>
                    <span className="font-black text-app-text">₹{Number(preview.discountedPrice).toLocaleString('en-IN')}</span>
                    <span className="text-xs text-muted line-through">₹{Number(preview.price).toLocaleString('en-IN')}</span>
                    {discountPct > 0 && <span className="text-[10px] font-black text-emerald-400">{discountPct}% off</span>}
                  </>
                ) : (
                  <span className="font-black text-app-text">₹{Number(preview.price || 0).toLocaleString('en-IN')}</span>
                )}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${preview.stock > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {preview.stock > 0 ? `${preview.stock} in stock` : 'Out of stock'}
                </span>
                <span className="text-[9px] text-muted font-bold">{preview.images} img · {preview.variants} var</span>
              </div>
            </div>
          </div>

          {/* Quick submit from any step */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-brand-primary text-black py-3 rounded-xl font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all text-xs shadow-lg shadow-brand-primary/20"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isEdit ? 'Save Changes' : 'Publish Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full py-3 rounded-xl border border-border text-xs font-black uppercase tracking-widest hover:bg-app-panel text-app-text transition-all"
          >
            Cancel
          </button>
        </aside>
      </form>
    </motion.div>
  );
}
