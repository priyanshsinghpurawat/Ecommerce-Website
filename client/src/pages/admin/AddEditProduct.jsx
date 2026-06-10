import { useEffect, useMemo, useState, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import ImageDropzone from '../../components/admin/ImageDropzone.jsx';
import VariantEditor from '../../components/admin/VariantEditor.jsx';
import { CategoryContext } from '../../context/CategoryContext.jsx';
import * as productService from '../../services/product.service.js';
import * as subcategoryService from '../../services/subcategory.service.js';
import { makeRemoteItem } from '../../utils/uploadHelpers.js';

const productSchema = z.object({
  title: z.string().trim().min(2, 'Title too short').max(120),
  description: z.string().trim().min(10, 'Description too short'),
  price: z.coerce.number().positive('Price must be > 0'),
  discountedPrice: z.union([z.literal(''), z.coerce.number().nonnegative()]).optional(),
  category: z.string().min(1, 'Pick a category'),
  subcategory: z.string().min(1, 'Pick a subcategory'),
  gender: z.enum(['men', 'unisex']).default('men'),
  stock: z.coerce.number().int().nonnegative().default(10),
  badge: z.enum(['', 'new-arrival', 'sale', 'street-drip']).default('')
});

/**
 * Powerlook/Savana-style Add/Edit product form.
 *  - Gallery: multi-image dropzone, first image becomes cover.
 *  - Variants: Color × Size with their own images, SKU, stock, price override.
 *  - Live preview card mirrors how the product will look on /shop.
 */
export default function AddEditProduct() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { categories, fetchCategories } = useContext(CategoryContext);

  const [subcategories, setSubcategories] = useState([]);
  const [gallery, setGallery] = useState([]);     // [{ id, previewUrl, kind, file?, url? }]
  const [variants, setVariants] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

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

  useEffect(() => {
    if (!watchedCategory) { setSubcategories([]); return; }
    let cancel = false;
    subcategoryService
      .getSubcategories(watchedCategory)
      .then((res) => { if (!cancel) setSubcategories(res?.data || []); })
      .catch(() => { if (!cancel) setSubcategories([]); });
    return () => { cancel = true; };
  }, [watchedCategory]);

  // Load existing product for edit
  useEffect(() => {
    if (!isEdit) return;
    let cancel = false;
    productService.getProductById(id).then((res) => {
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
      setVariants(
        (p.variants || []).map((v) => ({
          color: v.color || '',
          size: v.size || '',
          sku: v.sku || '',
          stock: v.stock ?? 0,
          price: v.price ?? '',
          images: (v.images || []).map(makeRemoteItem)
        }))
      );
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
      return;
    }
    setSubmitting(true);

    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      fd.append(k, String(v));
    });

    // Gallery: keep existing remote URLs, append new files as `gallery`
    const keepGallery = gallery.filter((i) => i.kind === 'remote').map((i) => i.url);
    fd.append('existingImages', JSON.stringify(keepGallery));
    gallery.filter((i) => i.kind === 'file').forEach((i) => fd.append('gallery', i.file));

    // Variants meta + per-variant files
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
      toast.success(isEdit ? 'Product updated' : 'Product created');
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
    badge: watched.badge
  }), [watched, gallery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto px-4 py-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to=".." className="p-2 rounded-md hover:bg-muted">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
            <p className="text-sm text-muted-foreground">
              Powerlook-style multi-image gallery with per-variant photos.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-app-card border border-border rounded-xl p-5 space-y-4 shadow-soft">
            <h2 className="font-semibold">Basics</h2>
            <div>
              <label className="text-sm font-medium">Title</label>
              <input {...register('title')} className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-app-bg text-app-text focus:outline-none focus:border-brand-primary" />
              {errors.title && <p className="text-xs text-error mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea rows={4} {...register('description')} className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-app-bg text-app-text focus:outline-none focus:border-brand-primary" />
              {errors.description && <p className="text-xs text-error mt-1">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-sm font-medium">Price (₹)</label>
                <input type="number" step="0.01" {...register('price')} className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-app-bg text-app-text focus:outline-none focus:border-brand-primary" />
                {errors.price && <p className="text-xs text-error mt-1">{errors.price.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Discounted</label>
                <input type="number" step="0.01" {...register('discountedPrice')} className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-app-bg text-app-text focus:outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="text-sm font-medium">Stock</label>
                <input type="number" {...register('stock')} className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-app-bg text-app-text focus:outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="text-sm font-medium">Badge</label>
                <select {...register('badge')} className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-app-bg text-app-text focus:outline-none focus:border-brand-primary">
                  <option value="">None</option>
                  <option value="new-arrival">New arrival</option>
                  <option value="sale">Sale</option>
                  <option value="street-drip">Street drip</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Category</label>
                <select {...register('category')} className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-app-bg text-app-text focus:outline-none focus:border-brand-primary">
                  <option value="">Select category</option>
                  {categories?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                {errors.category && <p className="text-xs text-error mt-1">{errors.category.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Subcategory</label>
                <select {...register('subcategory')} className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-app-bg text-app-text focus:outline-none focus:border-brand-primary">
                  <option value="">Select subcategory</option>
                  {subcategories.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                {errors.subcategory && <p className="text-xs text-error mt-1">{errors.subcategory.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Gender</label>
                <select {...register('gender')} className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-app-bg text-app-text focus:outline-none focus:border-brand-primary">
                  <option value="men">Men</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-app-card border border-border rounded-xl p-5 space-y-3 shadow-soft">
            <div>
              <h2 className="font-semibold">Product gallery</h2>
              <p className="text-xs text-muted-foreground">First image is the cover. Drag thumbnails to reorder.</p>
            </div>
            <ImageDropzone value={gallery} onChange={setGallery} maxFiles={10} />
          </section>

          <section className="bg-app-card border border-border rounded-xl p-5 shadow-soft">
            <VariantEditor value={variants} onChange={setVariants} />
          </section>
        </div>

        {/* Sticky preview + submit */}
        <aside className="space-y-4 lg:sticky lg:top-20 self-start">
          <div className="bg-app-card border border-border rounded-xl overflow-hidden shadow-soft">
            <div className="aspect-[4/5] bg-app-panel relative">
              {preview.cover ? (
                <img src={preview.cover} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  Cover preview
                </div>
              )}
              {preview.badge && (
                <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wide bg-primary text-primary-foreground px-2 py-1 rounded">
                  {preview.badge.replace('-', ' ')}
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-medium line-clamp-1">{preview.title}</p>
              <div className="mt-1 flex items-baseline gap-2">
                {preview.discountedPrice ? (
                  <>
                    <span className="font-semibold">₹{preview.discountedPrice}</span>
                    <span className="text-xs text-muted-foreground line-through">₹{preview.price}</span>
                  </>
                ) : (
                  <span className="font-semibold">₹{preview.price}</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {gallery.length} image{gallery.length === 1 ? '' : 's'} · {variants.length} variant{variants.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-brand-primary text-black py-2.5 rounded-md font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-60 transition-all shadow-md"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Save changes' : 'Create product'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full py-2.5 rounded-md border border-border text-sm font-bold uppercase tracking-wider hover:bg-app-panel text-app-text transition-all"
          >
            Cancel
          </button>
        </aside>
      </form>
    </motion.div>
  );
}
