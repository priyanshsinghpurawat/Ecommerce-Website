import { Product } from '../models/product.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { deleteFromCloudinary } from '../middleware/upload.middleware.js';
import { uploadFilesToCloudinary } from '../utils/cloudinaryUpload.js';
import { mapProductForResponse } from '../utils/imageUrl.js';
import { getCache, setCache, deleteCache, clearCacheByPattern } from '../utils/cache.js';

/* -------------------------------------------------------------------------- */
/* Multipart helpers                                                          */
/* -------------------------------------------------------------------------- */

/** Safely JSON.parse a string field, returning fallback on error. */
const safeJSON = (v, fallback) => {
  if (v == null || v === '') return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback; }
};

/**
 * Bucket multer's flat `req.files` array (uploadAny()) by fieldname:
 *   - cover           → single cover image
 *   - gallery         → flat product gallery
 *   - variant_<i>_images → per-variant gallery
 *   - colors_<i>_images  → legacy color subdoc (kept for compat)
 */
const bucketFilesByField = (files = []) => {
  const buckets = {
    cover: [],
    gallery: [],
    variants: {},   // { [index]: File[] }
    colorsLegacy: {}
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
      m = name.match(/^colors_(\d+)_images$/);
      if (m) {
        const i = Number(m[1]);
        (buckets.colorsLegacy[i] ||= []).push(f);
      }
    }
  }
  return buckets;
};

/** Parse the body fields that are JSON-stringified on the client. */
const parseProductMeta = (body) => {
  const meta = {};
  if (body.badge !== undefined) meta.badge = body.badge || '';
  if (body.rating !== undefined && body.rating !== '') meta.rating = Number(body.rating);
  if (body.reviewCount !== undefined && body.reviewCount !== '') meta.reviewCount = Number(body.reviewCount);
  const colors = safeJSON(body.colors, undefined);
  if (colors) meta.colors = colors;
  return meta;
};

/**
 * Upload everything to Cloudinary in parallel and produce the final shapes.
 * Returns: { coverUrl, galleryUrls, variants }
 *
 * `variantsMeta` is a JSON string from the client describing each variant:
 *   [{ color, size, sku, stock, price, keepImages: [<url>, ...] }, ...]
 * Per-variant uploaded files arrive under `variant_<i>_images`.
 */
const uploadAndAssemble = async (req, { keepExisting = {} } = {}) => {
  const buckets = bucketFilesByField(req.files);

  // Parallel uploads
  const [coverList, galleryList, ...variantUploads] = await Promise.all([
    uploadFilesToCloudinary(buckets.cover),
    uploadFilesToCloudinary(buckets.gallery),
    ...Object.keys(buckets.variants)
      .map(Number)
      .sort((a, b) => a - b)
      .map((i) => uploadFilesToCloudinary(buckets.variants[i]).then((urls) => ({ i, urls })))
  ]);

  const newVariantImagesByIndex = Object.fromEntries(variantUploads.map((v) => [v.i, v.urls]));

  const coverUrl = coverList[0]; // may be undefined
  const existingGallery = Array.isArray(keepExisting.gallery) ? keepExisting.gallery : [];
  const galleryUrls = [...existingGallery, ...galleryList];

  const variantsMeta = safeJSON(req.body.variantsMeta, []);
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
};

/** Best-effort rollback when DB write fails after uploads succeeded. */
const rollbackUploads = async ({ coverUrl, galleryUrls = [], variants = [] }) => {
  const all = [coverUrl, ...galleryUrls, ...variants.flatMap((v) => v.images || [])].filter(Boolean);
  await Promise.allSettled(all.map((u) => deleteFromCloudinary(u)));
};

/* -------------------------------------------------------------------------- */
/* CRUD                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * @desc   Create a product
 * @route  POST /api/v1/products
 * @access Private/Admin/Seller
 */
export const createProduct = asyncHandler(async (req, res) => {
  const { title, description, price, discountedPrice, category, subcategory, stock, gender } = req.body;
  const finalSellerId = req.user._id; // never trust body.seller — enforce ownership

  const uploaded = await uploadAndAssemble(req);
  const { coverUrl, galleryUrls, variants } = uploaded;

  try {
    const product = await Product.create({
      title,
      description,
      price: Number(price),
      discountedPrice: discountedPrice === '' || discountedPrice == null ? null : Number(discountedPrice),
      category,
      subcategory,
      gender: gender || 'men',
      stock: stock !== undefined ? Number(stock) : 10,
      seller: finalSellerId,
      image: coverUrl || (galleryUrls[0] ?? undefined),
      images: galleryUrls,
      variants,
      ...parseProductMeta(req.body)
    });

    const populated = await Product.findById(product._id)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('seller', 'name email');

    clearCacheByPattern('products:');

    return res
      .status(201)
      .json(new ApiResponse(201, mapProductForResponse(populated, req), 'Product created successfully'));
  } catch (error) {
    await rollbackUploads(uploaded);
    throw error;
  }
});

/**
 * @desc   List products (search / filter / pagination / sort)
 * @route  GET /api/v1/products
 * @access Public
 */
export const getAllProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', category = '', subcategory = '', sort = 'latest', badge = '', seller = '', minPrice = '', maxPrice = '', color = '' } = req.query;

  // SECURITY CHECK: 
  // We must ensure 'search' is a string. If an attacker passes an object (e.g. ?search[$gt]=), 
  // it could lead to a NoSQL injection. We block this here.
  if (search && typeof search !== 'string') {
    return res.status(400).send('We must block object injection to prevent security leaks');
  }

  // CACHING LOGIC:
  // To make the API faster, we store the result in memory (Map).
  // If the exact same request comes in again, we return the 'cached' result instantly.
  const cacheKey = `products:page=${page}:limit=${limit}:search=${search}:cat=${category}:sub=${subcategory}:sort=${sort}:badge=${badge}:sel=${seller}:minP=${minPrice}:maxP=${maxPrice}:clr=${color}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return res.status(200).json(new ApiResponse(200, cached, 'Products retrieved successfully (cached)'));
  }

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

  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Color filter — matches variant colors or product colors (comma-separated)
  if (color) {
    const colors = String(color).split(',').map(c => c.trim()).filter(Boolean);
    if (colors.length > 0) {
      const regexes = colors.map(c => {
        const safe = c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`^${safe}$`, 'i');
      });
      query.$or = [
        { 'variants.color': { $in: regexes } },
        { 'colors.name': { $in: regexes } }
      ];
    }
  }

  const sortMap = { 
    latest: { createdAt: -1 }, 
    oldest: { createdAt: 1 }, 
    priceAsc: { price: 1 }, 
    priceDesc: { price: -1 },
    bestSelling: { soldCount: -1 },
    popularity: { rating: -1, soldCount: -1 }
  };
  const sortOption = sortMap[sort] || sortMap.latest;

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const totalProducts = await Product.countDocuments(query);
  const totalPages = Math.ceil(totalProducts / limitNum) || 1;
  if (pageNum > totalPages && totalProducts > 0) {
    throw new ApiError(404, `Page ${pageNum} not found. Total pages: ${totalPages}`);
  }

  const products = await Product.find(query)
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .populate('seller', 'name email')
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum);

  const payload = {
    products: products.map((p) => mapProductForResponse(p, req)),
    pagination: { totalProducts, totalPages, currentPage: pageNum, limit: limitNum }
  };
  setCache(cacheKey, payload, 300);

  return res.status(200).json(new ApiResponse(200, payload, 'Products retrieved successfully'));
});

/**
 * @desc   Get single product
 * @route  GET /api/v1/products/:id
 * @access Public
 */
export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const cacheKey = `product:id=${id}`;
  const cached = getCache(cacheKey);
  if (cached) return res.status(200).json(new ApiResponse(200, cached, 'Product details retrieved successfully (cached)'));

  const product = await Product.findById(id)
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .populate('seller', 'name brandName avatar email');
  if (!product) throw new ApiError(404, 'Product not found');

  const relatedRaw = await Product.find({ seller: product.seller?._id, _id: { $ne: id } })
    .limit(6)
    .populate('category subcategory');

  const responseData = {
    ...mapProductForResponse(product, req),
    relatedProducts: relatedRaw.map((p) => mapProductForResponse(p, req))
  };

  setCache(cacheKey, responseData, 600);
  return res.status(200).json(new ApiResponse(200, responseData, 'Product details retrieved successfully'));
});

/**
 * @desc   Update product
 * @route  PUT /api/v1/products/:id
 * @access Private/Admin/Seller
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this product');
  }

  // The client passes the list of existing images it wants to keep; the rest
  // get deleted from Cloudinary. Same for variants via `variantsMeta.keepImages`.
  const keepGallery = safeJSON(req.body.existingImages, product.images || []);
  const uploaded = await uploadAndAssemble(req, { keepExisting: { gallery: keepGallery } });
  const { coverUrl, galleryUrls, variants } = uploaded;

  const previousCover = product.image;
  const previousGallery = product.images || [];
  const previousVariantImages = (product.variants || []).flatMap((v) => v.images || []);

  try {
    const { title, description, price, discountedPrice, category, subcategory, stock, gender } = req.body;
    if (title) product.title = title;
    if (description) product.description = description;
    if (price !== undefined && price !== '') product.price = Number(price);
    if (discountedPrice !== undefined) product.discountedPrice = discountedPrice === '' ? null : Number(discountedPrice);
    if (category) product.category = category;
    if (subcategory) product.subcategory = subcategory;
    if (gender) product.gender = gender;
    if (stock !== undefined && stock !== '') product.stock = Number(stock);

    if (coverUrl) product.image = coverUrl;
    product.images = galleryUrls;
    if (Array.isArray(safeJSON(req.body.variantsMeta, null))) {
      product.variants = variants;
    }

    const meta = parseProductMeta(req.body);
    if (meta.badge !== undefined) product.badge = meta.badge;
    if (meta.rating !== undefined) product.rating = meta.rating;
    if (meta.reviewCount !== undefined) product.reviewCount = meta.reviewCount;
    if (meta.colors) product.colors = meta.colors;

    await product.save();

    // Cleanup: anything no longer referenced gets removed from Cloudinary.
    const keptNow = new Set([
      product.image,
      ...product.images,
      ...product.variants.flatMap((v) => v.images || [])
    ].filter(Boolean));
    const toDelete = [
      previousCover && coverUrl ? previousCover : null,
      ...previousGallery.filter((u) => !keptNow.has(u)),
      ...previousVariantImages.filter((u) => !keptNow.has(u))
    ].filter(Boolean);
    await Promise.allSettled(toDelete.map((u) => deleteFromCloudinary(u)));

    const updated = await Product.findById(product._id)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug');

    clearCacheByPattern('products:');
    deleteCache(`product:id=${id}`);

    return res
      .status(200)
      .json(new ApiResponse(200, mapProductForResponse(updated, req), 'Product updated successfully'));
  } catch (error) {
    await rollbackUploads(uploaded);
    throw error;
  }
});

/**
 * @desc   Delete product
 * @route  DELETE /api/v1/products/:id
 * @access Private/Admin/Seller
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this product');
  }

  const imagesToDelete = [
    product.image,
    ...(product.images || []),
    ...(product.colors || []).flatMap((c) => c.images || []),
    ...(product.variants || []).flatMap((v) => v.images || [])
  ].filter(Boolean);

  await Product.findByIdAndDelete(id);
  await Promise.allSettled(imagesToDelete.map((u) => deleteFromCloudinary(u)));

  clearCacheByPattern('products:');
  deleteCache(`product:id=${id}`);

  return res.status(200).json(new ApiResponse(200, null, 'Product and its images deleted successfully'));
});
