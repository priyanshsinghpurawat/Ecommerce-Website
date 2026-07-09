import { Order } from '../models/order.model.js';
import { Variant } from '../models/variant.model.js';
import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import { Review } from '../models/review.model.js';
import { ProductService } from '../services/product.service.js';
import {
  asyncHandler,
  ApiError,
  ApiResponse,
  mapProductForResponse,
  safeJSON,
} from '../utils/helpers.js';

/**
 * @desc   Create a product
 * @route  POST /api/v3/products
 * @access Private/Admin/Seller
 */
export const createProduct = asyncHandler(async (req, res) => {
  const { title, description, price, discountedPrice, category, subcategory, stock, gender } =
    req.body;
  const finalSellerId = req.user._id;

  const uploaded = await ProductService.uploadAndAssemble(req.files, req.body);
  const { coverUrl, galleryUrls, variants } = uploaded;

  try {
    const product = await Product.create({
      title,
      description,
      price: Number(price),
      discountedPrice:
        discountedPrice === '' || discountedPrice == null ? null : Number(discountedPrice),
      category,
      subcategory,
      gender: gender || 'men',
      stock: stock !== undefined ? Number(stock) : 10,
      seller: finalSellerId,
      image: coverUrl || (galleryUrls[0] ?? undefined),
      images: galleryUrls,
      ...ProductService.parseProductMeta(req.body, req.user.role),
    });

    const populated = await Product.findById(product._id)
      .populate({ path: 'category', select: 'name slug' })
      .populate({ path: 'subcategory', select: 'name slug' })
      .populate({ path: 'seller', select: 'name email' });

    await ProductService.syncStandaloneFromEmbedded(product._id, variants);

    return res
      .status(201)
      .json(
        new ApiResponse(201, mapProductForResponse(populated, req), 'Product created successfully'),
      );
  } catch (error) {
    await ProductService.rollbackUploads(uploaded);
    throw error;
  }
});

/**
 * @desc   List products (search / filter / pagination / sort)
 * @route  GET /api/v3/products
 * @access Public
 */
export const getAllProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    category = '',
    subcategory = '',
    sort = 'latest',
    badge = '',
    seller = '',
    minPrice = '',
    maxPrice = '',
    color = '',
  } = req.query;

  if (search && typeof search !== 'string') {
    throw new ApiError(400, 'Invalid search parameter');
  }

  const query = ProductService.buildCatalogQuery({
    search: String(search).trim(),
    category,
    subcategory,
    badge,
    seller,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    color,
  });
  const sortOption = ProductService.getSortOption(sort);

  // Pagination with validation
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(Math.max(1, Number(limit) || 10), 100);
  const skip = (pageNum - 1) * limitNum;

  // Batch operation for better performance
  const [totalProducts, products] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .populate({ path: 'category', select: 'name slug' })
      .populate({ path: 'subcategory', select: 'name slug' })
      .populate({ path: 'seller', select: 'name email' })
      .lean(),
  ]);

  const totalPages = Math.ceil(totalProducts / limitNum) || 1;
  if (pageNum > totalPages && totalProducts > 0) {
    throw new ApiError(404, `Page ${pageNum} not found. Total pages: ${totalPages}`);
  }

  const payload = {
    products: products.map((p) => mapProductForResponse(p, req)),
    pagination: { totalProducts, totalPages, currentPage: pageNum, limit: limitNum },
  };

  return res.status(200).json(new ApiResponse(200, payload, 'Products retrieved successfully'));
});

/**
 * @desc   Get distinct filter values (e.g. colours) for the shop sidebar
 * @route  GET /api/v3/products/filters
 * @access Public
 */
export const getProductFilters = asyncHandler(async (req, res) => {
  const raw = await Variant.distinct('optionValues.Color', { deletedAt: null });
  const colors = [
    ...new Set(
      raw
        .filter(Boolean)
        .map((c) => String(c).trim())
        .filter(Boolean),
    ),
  ].sort();

  const payload = { colors };

  return res
    .status(200)
    .json(new ApiResponse(200, payload, 'Product filters retrieved successfully'));
});

/**
 * @desc   Get single product
 * @route  GET /api/v3/products/:id
 * @access Public
 */
export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const filter = isObjectId ? { _id: id } : { slug: id };
  const product = await Product.findOne(filter)
    .populate({ path: 'category', select: 'name slug' })
    .populate({ path: 'subcategory', select: 'name slug' })
    .populate({ path: 'seller', select: 'name brandName avatar email' })
    .populate({
      path: 'relatedProducts',
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'subcategory', select: 'name slug' },
      ],
    })
    .lean();
  if (!product) throw new ApiError(404, 'Product not found');

  let crossSells = product.relatedProducts || [];

  if (crossSells.length < 4) {
    const fallbackCount = 8 - crossSells.length;
    const existingIds = [product._id, ...crossSells.map((p) => p._id)];

    const subcatFallback = await Product.find({
      subcategory: product.subcategory?._id,
      _id: { $nin: existingIds },
    })
      .limit(fallbackCount)
      .populate({ path: 'category' })
      .populate({ path: 'subcategory' })
      .lean();

    crossSells = [...crossSells, ...subcatFallback];

    if (crossSells.length < 4) {
      const remainingCount = 8 - crossSells.length;
      const allIds = [product._id, ...crossSells.map((p) => p._id)];
      const catFallback = await Product.find({
        category: product.category?._id,
        _id: { $nin: allIds },
      })
        .limit(remainingCount)
        .populate({ path: 'category' })
        .populate({ path: 'subcategory' })
        .lean();
      crossSells = [...crossSells, ...catFallback];
    }
  }

  const responseData = {
    ...mapProductForResponse(product, req),
    relatedProducts: crossSells.map((p) => mapProductForResponse(p, req)),
  };

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, 'Product details retrieved successfully'));
});

/**
 * @desc   Get frequently bought together products
 * @route  GET /api/v3/products/:id/frequently-bought-together
 * @access Public
 */
export const getFrequentlyBoughtTogether = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const currentProduct = await Product.findOne(isObjectId ? { _id: id } : { slug: id }).lean();
  if (!currentProduct) throw new ApiError(404, 'Product not found');
  const actualId = currentProduct._id;

  // 1. Find orders containing this product
  const frequentCompanions = await Order.aggregate([
    { $match: { 'items.product': actualId } },
    { $unwind: '$items' },
    { $match: { 'items.product': { $ne: actualId } } },
    {
      $group: {
        _id: '$items.product',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 4 },
  ]);

  let companionIds = frequentCompanions.map((c) => c._id);
  let products = [];

  if (companionIds.length > 0) {
    products = await Product.find({
      _id: { $in: companionIds },
    })
      .populate({ path: 'category', select: 'name slug' })
      .populate({ path: 'subcategory', select: 'name slug' })
      .lean();

    // Maintain the order from aggregation
    products.sort((a, b) => {
      return (
        companionIds.findIndex((cid) => cid.equals(a._id)) -
        companionIds.findIndex((cid) => cid.equals(b._id))
      );
    });
  }

  // Fallback: If no frequent companions, get some from same subcategory but different from current product
  if (products.length < 4) {
    const existingIds = [actualId.toString(), ...products.map((p) => p._id.toString())];

    const fallback = await Product.find({
      subcategory: currentProduct?.subcategory,
      _id: { $nin: existingIds },
    })
      .limit(4 - products.length)
      .populate({ path: 'category', select: 'name slug' })
      .populate({ path: 'subcategory', select: 'name slug' })
      .lean();

    products = [...products, ...fallback];
  }

  const payload = products.map((p) => mapProductForResponse(p, req));

  return res
    .status(200)
    .json(new ApiResponse(200, payload, 'Frequently bought together products retrieved'));
});

/**
 * @desc   Update product
 * @route  PUT /api/v3/products/:id
 * @access Private/Admin/Seller
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this product');
  }

  const keepGallery = safeJSON(req.body.existingImages, product.images || []);
  const uploaded = await ProductService.uploadAndAssemble(req.files, req.body, {
    keepExisting: { gallery: keepGallery },
  });
  const { coverUrl, galleryUrls, variants } = uploaded;

  const previousCover = product.image;
  const previousGallery = product.images || [];

  try {
    const { title, description, price, discountedPrice, category, subcategory, stock, gender } =
      req.body;
    if (title) product.title = title;
    if (description) product.description = description;
    if (price !== undefined && price !== '') product.price = Number(price);
    if (discountedPrice !== undefined)
      product.discountedPrice = discountedPrice === '' ? null : Number(discountedPrice);
    if (category) product.category = category;
    if (subcategory) product.subcategory = subcategory;
    if (gender) product.gender = gender;
    if (stock !== undefined && stock !== '') product.stock = Number(stock);

    const finalCover = coverUrl || req.body.existingCover || product.image;
    product.image = finalCover;
    product.images = galleryUrls.filter((url) => url !== finalCover);

    const meta = ProductService.parseProductMeta(req.body, req.user.role);
    if (meta.badge !== undefined) product.badge = meta.badge;
    if (meta.relatedProducts !== undefined) product.relatedProducts = meta.relatedProducts;

    if (req.user.role === 'admin') {
      if (meta.rating !== undefined) product.rating = meta.rating;
      if (meta.reviewCount !== undefined) product.reviewCount = meta.reviewCount;
    }

    await product.save();

    const toDelete = [
      previousCover && coverUrl ? previousCover : null,
      ...previousGallery.filter((u) => u !== product.image && !galleryUrls.includes(u)),
    ].filter(Boolean);

    await ProductService.deleteImages(toDelete);

    const updated = await Product.findById(product._id)
      .populate({ path: 'category', select: 'name slug' })
      .populate({ path: 'subcategory', select: 'name slug' });

    await ProductService.syncStandaloneFromEmbedded(product._id, variants);

    return res
      .status(200)
      .json(
        new ApiResponse(200, mapProductForResponse(updated, req), 'Product updated successfully'),
      );
  } catch (error) {
    await ProductService.rollbackUploads(uploaded);
    throw error;
  }
});

/**
 * @desc   Delete product
 * @route  DELETE /api/v3/products/:id
 * @access Private/Admin/Seller
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this product');
  }

  const imagesToDelete = [product.image, ...(product.images || [])].filter(Boolean);

  // Soft-delete associated variants
  const variantImages = await Variant.find({ product: id, deletedAt: null }).select('images');
  for (const vi of variantImages) {
    if (vi.images?.length) imagesToDelete.push(...vi.images);
  }
  await Variant.updateMany({ product: id, deletedAt: null }, { $set: { deletedAt: new Date() } });

  // Clean up associated reviews and their image attachments
  const productReviews = await Review.find({ product: id });
  const reviewImages = productReviews.flatMap((r) => r.images || []).filter(Boolean);
  if (reviewImages.length > 0) {
    imagesToDelete.push(...reviewImages);
  }
  await Review.deleteMany({ product: id });

  await Product.findByIdAndDelete(id);
  await ProductService.deleteImages(imagesToDelete);

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Product and its images deleted successfully'));
});
