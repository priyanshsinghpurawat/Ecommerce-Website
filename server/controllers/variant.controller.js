import { Variant } from '../models/variant.model.js';
import { Product } from '../models/product.model.js';
import { asyncHandler, ApiError, ApiResponse } from '../utils/helpers.js';
import { VariantFactory } from '../services/variantFactory.js';

/**
 * @desc    Generate variant matrix from product options
 * @route   POST /api/v3/products/:id/variants/generate
 * @access  Private/Admin/Seller
 */
export const generateVariants = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { options } = req.body;

  if (!options || !Array.isArray(options) || options.length === 0) {
    throw new ApiError(400, 'At least one option with values is required');
  }

  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to manage this product');
  }

  const matrix = VariantFactory.generateMatrix(options, product.productCode);

  // Ensure unique SKUs
  const variants = [];
  for (const v of matrix) {
    const uniqueSKU = await VariantFactory.ensureUniqueSKU(v.sku, product._id);
    variants.push({ ...v, sku: uniqueSKU });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { variants, count: variants.length }, 'Variant matrix generated'));
});

/**
 * @desc    Bulk upsert variants for a product
 * @route   POST /api/v3/products/:id/variants/bulk
 * @access  Private/Admin/Seller
 */
export const bulkUpsertVariants = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { variants } = req.body;

  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    throw new ApiError(400, 'Variants array is required');
  }

  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to manage this product');
  }

  const created = [];
  const updated = [];
  const errors = [];

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    try {
      // Validate required fields
      if (!v.sku || !v.sku.trim()) {
        errors.push({ row: i, field: 'sku', message: 'SKU is required' });
        continue;
      }

      const sku = v.sku.trim().toUpperCase();
      const optionValues = v.optionValues || {};
      if (v.color) optionValues.Color = v.color;
      if (v.size) optionValues.Size = v.size;

      // Check for existing variant by SKU (scoped to this product to prevent cross-tenant overwrites)
      let existing = await Variant.findOne({ sku, product: product._id, deletedAt: null });

      if (existing) {
        // Update existing
        existing.price = v.price != null ? Number(v.price) : existing.price;
        existing.compareAtPrice = v.compareAtPrice != null ? Number(v.compareAtPrice) : existing.compareAtPrice;
        existing.stock = v.stock != null ? Number(v.stock) : existing.stock;
        existing.optionValues = new Map(Object.entries(optionValues));
        if (v.images) existing.images = v.images;

        // Respect SKU lock
        if (!existing.skuLocked && v.sku && v.sku !== existing.sku) {
          existing.sku = sku;
        }

        await existing.save();
        updated.push({ _id: existing._id, sku: existing.sku });
      } else {
        // Create new variant
        const newVariant = await Variant.create({
          product: product._id,
          sku,
          price: v.price != null ? Number(v.price) : null,
          compareAtPrice: v.compareAtPrice != null ? Number(v.compareAtPrice) : null,
          stock: Number(v.stock) || 0,
          optionValues: new Map(Object.entries(optionValues)),
          images: v.images || []
        });
        created.push({ _id: newVariant._id, sku: newVariant.sku });
      }
    } catch (err) {
      errors.push({ row: i, field: 'general', message: err.message });
    }
  }

  // Recalculate product summary
  await Product.recalculateVariantSummary(product._id);

  return res
    .status(200)
    .json(new ApiResponse(200, {
      created,
      updated,
      errors,
      summary: { created: created.length, updated: updated.length, failed: errors.length }
    }, 'Bulk upsert completed'));
});

/**
 * @desc    Update variant stock (inline edit)
 * @route   PATCH /api/v3/variants/:id/stock
 * @access  Private/Admin/Seller
 */
export const updateVariantStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  if (stock === undefined || stock === null || stock < 0) {
    throw new ApiError(400, 'Valid stock value is required');
  }

  const variant = await Variant.findById(id);
  if (!variant) throw new ApiError(404, 'Variant not found');

  const product = await Product.findById(variant.product);
  if (!product) throw new ApiError(404, 'Parent product not found');

  if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to update this variant');
  }

  variant.stock = Number(stock);
  await variant.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { _id: variant._id, stock: variant.stock, sku: variant.sku }, 'Stock updated'));
});

/**
 * @desc    Get all variants for a product
 * @route   GET /api/v3/products/:id/variants
 * @access  Public
 */
export const getProductVariants = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');

  const variants = await Variant.find({ product: id, deletedAt: null })
    .sort({ createdAt: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, variants, 'Variants retrieved'));
});

/**
 * @desc    Soft-delete a variant
 * @route   DELETE /api/v3/variants/:id
 * @access  Private/Admin/Seller
 */
export const deleteVariant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const variant = await Variant.findById(id);
  if (!variant) throw new ApiError(404, 'Variant not found');

  const product = await Product.findById(variant.product);
  if (!product) throw new ApiError(404, 'Parent product not found');

  if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to delete this variant');
  }

  variant.deletedAt = new Date();
  await variant.save();

  await Product.recalculateVariantSummary(product._id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Variant deleted'));
});

/**
 * @desc    Toggle SKU lock on a variant
 * @route   PATCH /api/v3/variants/:id/sku-lock
 * @access  Private/Admin/Seller
 */
export const toggleSkuLock = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const variant = await Variant.findById(id);
  if (!variant) throw new ApiError(404, 'Variant not found');

  variant.skuLocked = !variant.skuLocked;
  await variant.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { _id: variant._id, skuLocked: variant.skuLocked }, `SKU ${variant.skuLocked ? 'locked' : 'unlocked'}`));
});

/**
 * @desc    Bulk update stock for multiple variants
 * @route   PATCH /api/v3/variants/bulk-stock
 * @access  Private/Admin/Seller
 */
export const bulkUpdateStock = asyncHandler(async (req, res) => {
  const { updates } = req.body;

  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    throw new ApiError(400, 'Updates array is required');
  }

  const result = await Variant.bulkUpdateStock(updates);

  return res
    .status(200)
    .json(new ApiResponse(200, result, 'Stock updated'));
});
