import { uploadFilesToCloudinary } from '../utils/cloudinaryUpload.js';
import { deleteFromCloudinary } from '../middleware/upload.middleware.js';

const safeJSON = (v, fallback) => {
  if (v == null || v === '') return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback; }
};

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
        query['variants.color'] = { $in: regexes };
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
