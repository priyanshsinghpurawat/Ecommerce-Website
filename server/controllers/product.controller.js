import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';
import { ProductRepository } from '../repositories/product.repository.js';
import { ProductService } from '../services/product.service.js';
import { asyncHandler, ApiError, ApiResponse, mapProductForResponse } from '../utils/helpers.js';
import { getCache, setCache, deleteCache, clearCacheByPattern } from '../utils/cache.js';

/** Safely JSON.parse a string field, returning fallback on error. */
const safeJSON = (v, fallback) => {
  if (v == null || v === '') return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback; }
};

/**
 * @desc   Create a product
 * @route  POST /api/v1/products
 * @access Private/Admin/Seller
 */
export const createProduct = asyncHandler(async (req, res) => {
  const { title, description, price, discountedPrice, category, subcategory, stock, gender } = req.body;
  const finalSellerId = req.user._id;

  const uploaded = await ProductService.uploadAndAssemble(req.files, req.body);
  const { coverUrl, galleryUrls, variants } = uploaded;

  try {
    const product = await ProductRepository.create({
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
      ...ProductService.parseProductMeta(req.body)
    });

    const populated = await ProductRepository.findById(product._id, [
      { path: 'category', select: 'name slug' },
      { path: 'subcategory', select: 'name slug' },
      { path: 'seller', select: 'name email' }
    ]);

    await clearCacheByPattern('products:');

    return res
      .status(201)
      .json(new ApiResponse(201, mapProductForResponse(populated, req), 'Product created successfully'));
  } catch (error) {
    await ProductService.rollbackUploads(uploaded);
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

  // Block object injection to prevent security leaks
  if (search && typeof search !== 'string') {
    return res.status(400).send('We must block object injection to prevent security leaks');
  }

  const cacheKey = `products:page=${page}:limit=${limit}:search=${search}:cat=${category}:sub=${subcategory}:sort=${sort}:badge=${badge}:sel=${seller}:minP=${minPrice}:maxP=${maxPrice}:clr=${color}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.status(200).json(new ApiResponse(200, cached, 'Products retrieved successfully (cached)'));
  }

  const query = ProductService.buildCatalogQuery({ search, category, subcategory, badge, seller, minPrice, maxPrice, color });
  const sortOption = ProductService.getSortOption(sort);

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const totalProducts = await ProductRepository.countDocuments(query);
  const totalPages = Math.ceil(totalProducts / limitNum) || 1;
  if (pageNum > totalPages && totalProducts > 0) {
    throw new ApiError(404, `Page ${pageNum} not found. Total pages: ${totalPages}`);
  }

  const products = await ProductRepository.find(query, {
    sort: sortOption,
    skip,
    limit: limitNum,
    populate: [
      { path: 'category', select: 'name slug' },
      { path: 'subcategory', select: 'name slug' },
      { path: 'seller', select: 'name email' }
    ]
  });

  const payload = {
    products: products.map((p) => mapProductForResponse(p, req)),
    pagination: { totalProducts, totalPages, currentPage: pageNum, limit: limitNum }
  };
  await setCache(cacheKey, payload, 300);

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
  const cached = await getCache(cacheKey);
  if (cached) return res.status(200).json(new ApiResponse(200, cached, 'Product details retrieved successfully (cached)'));

  const product = await ProductRepository.findById(id, [
    { path: 'category', select: 'name slug' },
    { path: 'subcategory', select: 'name slug' },
    { path: 'seller', select: 'name brandName avatar email' },
    {
      path: 'relatedProducts',
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'subcategory', select: 'name slug' }
      ]
    }
  ], true);
  if (!product) throw new ApiError(404, 'Product not found');

  let crossSells = product.relatedProducts || [];

  if (crossSells.length < 4) {
    const fallbackCount = 8 - crossSells.length;
    const existingIds = [id, ...crossSells.map(p => p._id)];

    const subcatFallback = await ProductRepository.find({
      subcategory: product.subcategory?._id,
      _id: { $nin: existingIds }
    }, {
      limit: fallbackCount,
      populate: [{ path: 'category' }, { path: 'subcategory' }],
      lean: true
    });

    crossSells = [...crossSells, ...subcatFallback];
    
    if (crossSells.length < 4) {
      const remainingCount = 8 - crossSells.length;
      const allIds = [id, ...crossSells.map(p => p._id)];
      const catFallback = await ProductRepository.find({
        category: product.category?._id,
        _id: { $nin: allIds }
      }, {
        limit: remainingCount,
        populate: [{ path: 'category' }, { path: 'subcategory' }],
        lean: true
      });
      crossSells = [...crossSells, ...catFallback];
    }
  }

  const responseData = {
    ...mapProductForResponse(product, req),
    relatedProducts: crossSells.map((p) => mapProductForResponse(p, req))
  };

  await setCache(cacheKey, responseData, 600);
  return res.status(200).json(new ApiResponse(200, responseData, 'Product details retrieved successfully'));
});

/**
 * @desc   Get frequently bought together products
 * @route  GET /api/v1/products/:id/frequently-bought-together
 * @access Public
 */
export const getFrequentlyBoughtTogether = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const cacheKey = `product:fbt:id=${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.status(200).json(new ApiResponse(200, cached, 'Frequently bought together products retrieved (cached)'));

  // 1. Find orders containing this product
  const frequentCompanions = await Order.aggregate([
    { $match: { 'items.product': new mongoose.Types.ObjectId(id) } },
    { $unwind: '$items' },
    { $match: { 'items.product': { $ne: new mongoose.Types.ObjectId(id) } } },
    {
      $group: {
        _id: '$items.product',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 4 }
  ]);

  let companionIds = frequentCompanions.map((c) => c._id);
  let products = [];

  if (companionIds.length > 0) {
    products = await ProductRepository.find(
      {
        _id: { $in: companionIds }
      },
      {
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'subcategory', select: 'name slug' }
        ],
        lean: true
      }
    );

    // Maintain the order from aggregation
    products.sort((a, b) => {
      return companionIds.findIndex(cid => cid.equals(a._id)) - companionIds.findIndex(cid => cid.equals(b._id));
    });
  }

  // Fallback: If no frequent companions, get some from same subcategory but different from current product
  if (products.length < 4) {
    const currentProduct = await ProductRepository.findById(id);
    const existingIds = [id, ...products.map((p) => p._id.toString())];

    const fallback = await ProductRepository.find(
      {
        subcategory: currentProduct?.subcategory,
        _id: { $nin: existingIds }
      },
      {
        limit: 4 - products.length,
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'subcategory', select: 'name slug' }
        ],
        lean: true
      }
    );

    products = [...products, ...fallback];
  }

  const payload = products.map((p) => mapProductForResponse(p, req));
  await setCache(cacheKey, payload, 3600); // Cache for 1 hour

  return res.status(200).json(new ApiResponse(200, payload, 'Frequently bought together products retrieved'));
});

/**
 * @desc   Update product
 * @route  PUT /api/v1/products/:id
 * @access Private/Admin/Seller
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await ProductRepository.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this product');
  }

  const keepGallery = safeJSON(req.body.existingImages, product.images || []);
  const uploaded = await ProductService.uploadAndAssemble(req.files, req.body, { keepExisting: { gallery: keepGallery } });
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

    const meta = ProductService.parseProductMeta(req.body);
    if (meta.badge !== undefined) product.badge = meta.badge;
    if (meta.rating !== undefined) product.rating = meta.rating;
    if (meta.reviewCount !== undefined) product.reviewCount = meta.reviewCount;
    if (meta.relatedProducts !== undefined) product.relatedProducts = meta.relatedProducts;

    await product.save();

    // Cleanup unreferenced files from Cloudinary
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
    
    await ProductService.deleteImages(toDelete);

    const updated = await ProductRepository.findById(product._id, [
      { path: 'category', select: 'name slug' },
      { path: 'subcategory', select: 'name slug' }
    ]);

    await clearCacheByPattern('products:');
    await deleteCache(`product:id=${id}`);

    return res
      .status(200)
      .json(new ApiResponse(200, mapProductForResponse(updated, req), 'Product updated successfully'));
  } catch (error) {
    await ProductService.rollbackUploads(uploaded);
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
  const product = await ProductRepository.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this product');
  }

  const imagesToDelete = [
    product.image,
    ...(product.images || []),
    ...(product.variants || []).flatMap((v) => v.images || [])
  ].filter(Boolean);

  await ProductRepository.findByIdAndDelete(id);
  await ProductService.deleteImages(imagesToDelete);

  await clearCacheByPattern('products:');
  await deleteCache(`product:id=${id}`);

  return res.status(200).json(new ApiResponse(200, null, 'Product and its images deleted successfully'));
});
