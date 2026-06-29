import { uploadFilesToCloudinary } from '../utils/cloudinaryUpload.js';
import { deleteFromCloudinary } from '../middleware/upload.middleware.js';
import { Variant } from '../models/variant.model.js';
import { safeJSON } from '../utils/helpers.js';

const bucketFilesByField = (files = []) => {
  const buckets = {
    cover: [],
    gallery: [],
    variants: {},
  };
  for (const f of files) {
    const name = f.fieldname || '';
    if (name === 'cover' || name === 'image') buckets.cover.push(f);
    else if (name === 'gallery' || name === 'images') buckets.gallery.push(f);
    else {
      let m = name.match(/^variant_(\d+)_images$/);
      if (m) {
        const i = Number(m[1]);
        (buckets.variants[i] ||= []).push(f);
        continue;
      }
    }
  }
  return buckets;
};

export class ProductService {
  /** Upload files to Cloudinary and assemble schema objects */
  static async uploadAndAssemble(files, body, { keepExisting = {} } = {}) {
    const buckets = bucketFilesByField(files);

    const [coverList, galleryList, ...variantUploads] = await Promise.all([
      uploadFilesToCloudinary(buckets.cover),
      uploadFilesToCloudinary(buckets.gallery),
      ...Object.keys(buckets.variants)
        .map(Number)
        .sort((a, b) => a - b)
        .map((i) => uploadFilesToCloudinary(buckets.variants[i]).then((urls) => ({ i, urls })))
    ]);

    const newVariantImagesByIndex = Object.fromEntries(variantUploads.map((v) => [v.i, v.urls]));
    const coverUrl = coverList[0];
    const existingGallery = Array.isArray(keepExisting.gallery) ? keepExisting.gallery : [];
    const galleryUrls = [...existingGallery, ...galleryList];

    const variantsMeta = safeJSON(body.variantsMeta, []);
    const variants = Array.isArray(variantsMeta)
      ? variantsMeta.map((v, i) => ({
          color: String(v?.color || '').trim(),
          size: String(v?.size || '').trim(),
          sku: String(v?.sku || '').trim(),
          stock: Number.isFinite(Number(v?.stock)) ? Number(v.stock) : 0,
          price: v?.price === '' || v?.price == null ? null : Number(v.price),
          images: [
            ...(Array.isArray(v?.keepImages) ? v.keepImages : []),
            ...(newVariantImagesByIndex[i] || [])
          ]
        }))
      : [];

    return { coverUrl, galleryUrls, variants };
  }

  /** Sync embedded variants in product document (backward compat) */
  static async syncEmbeddedVariants(productId) {
    const product = await import('../models/product.model.js').then(m => m.Product.findById(productId));
    if (!product) return;

    // Build embedded variants from standalone Variant collection
    const dbVariants = await Variant.find({ product: productId, deletedAt: null });
    product.variants = dbVariants.map(v => ({
      color: v.optionValues.get('Color') || '',
      size: v.optionValues.get('Size') || '',
      sku: v.sku,
      stock: v.stock,
      price: v.price,
      images: v.images || []
    }));

    await product.save();
  }

  /**
   * Upsert standalone Variant documents from the provided variants array.
   * Called after product create/update so the Variant collection stays populated.
   * @param {string} productId
   * @param {Array} variants - Array of {color, size, sku, stock, price, images}
   */
  static async syncStandaloneFromEmbedded(productId, variants = []) {
    if (!variants.length) return;

    const existing = await Variant.find({ product: productId, deletedAt: null });
    const existingBySku = new Map(existing.map(v => [v.sku, v]));

    for (const ev of variants) {
      if (!ev.sku) continue;
      try {
        const optionValues = new Map();
        if (ev.color) optionValues.set('Color', ev.color);
        if (ev.size) optionValues.set('Size', ev.size);

        const standalone = existingBySku.get(ev.sku);
        if (standalone) {
          standalone.price = ev.price;
          standalone.stock = ev.stock;
          standalone.optionValues = optionValues;
          if (ev.images?.length) standalone.images = ev.images;
          await standalone.save();
        } else {
          await Variant.create({
            product: productId,
            sku: ev.sku,
            price: ev.price,
            stock: ev.stock,
            optionValues,
            images: ev.images || []
          });
        }
      } catch { /* skip bad variant, continue sync */ }
    }

    const Product = (await import('../models/product.model.js')).Product;
    await Product.recalculateVariantSummary(productId);
  }

  /** Delete a set of images from Cloudinary */
  static async deleteImages(images = []) {
    const active = images.filter(Boolean);
    if (active.length === 0) return;
    await Promise.allSettled(active.map((u) => deleteFromCloudinary(u)));
  }

  /** Rollback successful uploads */
  static async rollbackUploads({ coverUrl, galleryUrls = [], variants = [] }) {
    const all = [coverUrl, ...galleryUrls, ...variants.flatMap((v) => v.images || [])];
    await this.deleteImages(all);
  }

  /** Parse secondary/meta fields from request body */
  static parseProductMeta(body) {
    const meta = {};
    if (body.badge !== undefined) meta.badge = body.badge || '';
    if (body.rating !== undefined && body.rating !== '') meta.rating = Number(body.rating);
    if (body.reviewCount !== undefined && body.reviewCount !== '') meta.reviewCount = Number(body.reviewCount);

    const related = safeJSON(body.relatedProducts, undefined);
    if (related) meta.relatedProducts = Array.isArray(related) ? related : [related];
    return meta;
  }

  /** Construct MongoDB query object from query parameters */
  static buildCatalogQuery({ search, category, subcategory, badge, seller, minPrice, maxPrice, color }) {
    const query = {};
    if (search) {
      const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.title = { $regex: safe, $options: 'i' };
    }
    const isValidId = (id) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);

    if (category && isValidId(category)) query.category = category;
    if (subcategory && isValidId(subcategory)) query.subcategory = subcategory;
    if (badge && badge !== 'undefined' && badge !== 'null') query.badge = badge;
    if (seller) query.seller = seller;

    if (minPrice || maxPrice) {
      const exprCond = [];
      if (minPrice) {
        exprCond.push({
          $gte: [
            { $ifNull: ["$discountedPrice", "$price"] },
            Number(minPrice)
          ]
        });
      }
      if (maxPrice) {
        exprCond.push({
          $lte: [
            { $ifNull: ["$discountedPrice", "$price"] },
            Number(maxPrice)
          ]
        });
      }
      query.$expr = { $and: exprCond };
    }

    if (color) {
      const colors = String(color).split(',').map(c => c.trim()).filter(Boolean);
      if (colors.length > 0) {
        const regexes = colors.map(c => {
          const safe = c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return new RegExp(`^${safe}$`, 'i');
        });
        query['variantSummary.colors'] = { $in: regexes };
      }
    }

    return query;
  }

  /** Map query sort string to MongoDB sort specification */
  static getSortOption(sort) {
    const sortMap = {
      latest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      priceAsc: { price: 1 },
      priceDesc: { price: -1 },
      bestSelling: { soldCount: -1 },
      popularity: { rating: -1, soldCount: -1 }
    };
    return sortMap[sort] || sortMap.latest;
  }
}
