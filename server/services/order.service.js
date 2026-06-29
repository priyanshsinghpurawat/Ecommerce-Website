/**
 * Shared order/stock service — single source of truth for all stock operations.
 * Fixes the DRY violation where stock deduction was duplicated across
 * order.controller.js, payment.controller.js, and cron.js.
 */
import { Variant } from '../models/variant.model.js';
import { Product } from '../models/product.model.js';
import { ApiError } from '../utils/helpers.js';

/**
 * Resolve the Variant document for a given cart/order item.
 * Tries: variant ref -> optionValues match -> null (no variant).
 */
export async function resolveVariant(item, session = null) {
  // 1. Direct variant reference (new path)
  if (item.variant) {
    let q = Variant.findById(item.variant);
    if (session) q = q.session(session);
    return q;
  }

  // 2. Option-values lookup (legacy path)
  const productId = item.product?._id || item.product;
  if (!productId) return null;

  const optionValues = {};
  if (item.color) optionValues.Color = item.color;
  if (item.size) optionValues.Size = item.size;

  if (Object.keys(optionValues).length === 0) return null;

  const query = { product: productId, deletedAt: null };
  for (const [k, v] of Object.entries(optionValues)) {
    query[`optionValues.${k}`] = v;
  }

  let q = Variant.findOne(query);
  if (session) q = q.session(session);
  return q;
}

/**
 * Deduct stock for a list of order items.
 * Uses the Variant model as the source of truth.
 * Items MUST be sorted by product._id beforehand to prevent deadlocks.
 */
export async function deductStock(items, session) {
  const variantOps = [];
  const productOps = [];

  // Sort items by product/variant ID to prevent database deadlocks
  const sortedItems = [...items].sort((a, b) => {
    const idA = (a.variant?._id || a.variant || a.product?._id || a.product || '').toString();
    const idB = (b.variant?._id || b.variant || b.product?._id || b.product || '').toString();
    return idA.localeCompare(idB);
  });

  // Verify stock levels before attempting write
  for (const item of sortedItems) {
    const productId = item.product?._id || item.product;
    const variant = await resolveVariant(item, session);

    if (variant) {
      if (variant.stock < item.quantity) {
        throw new ApiError(400, `Insufficient stock for "${item.title || 'item'}". It may have just sold out.`);
      }
      variantOps.push({
        updateOne: {
          filter: { _id: variant._id, stock: { $gte: item.quantity } },
          update: { $inc: { stock: -item.quantity } }
        }
      });
    } else {
      const product = await Product.findById(productId).session(session);
      if (!product || product.stock < item.quantity) {
        throw new ApiError(400, `Insufficient stock for "${item.title || 'item'}". It may have just sold out.`);
      }
      productOps.push({
        updateOne: {
          filter: { _id: productId, stock: { $gte: item.quantity } },
          update: { $inc: { stock: -item.quantity } }
        }
      });
    }
  }

  if (variantOps.length > 0) {
    const result = await Variant.bulkWrite(variantOps, { session });
    if (result.matchedCount !== variantOps.length) {
      throw new ApiError(400, "Some items became out of stock during checkout. Please try again.");
    }
  }

  if (productOps.length > 0) {
    const result = await Product.bulkWrite(productOps, { session });
    if (result.matchedCount !== productOps.length) {
      throw new ApiError(400, "Some items became out of stock during checkout. Please try again.");
    }
  }
}

/**
 * Restore stock for cancelled order items.
 */
export async function restoreStock(items, session) {
  const variantUpdates = [];
  const productUpdates = [];

  for (const item of items) {
    const variant = await resolveVariant(item, session);
    if (variant) {
      variantUpdates.push({
        updateOne: {
          filter: { _id: variant._id },
          update: { $inc: { stock: item.quantity } }
        }
      });
    } else {
      productUpdates.push({
        updateOne: {
          filter: { _id: item.product?._id || item.product },
          update: { $inc: { stock: item.quantity } }
        }
      });
    }
  }

  if (variantUpdates.length > 0) {
    await Variant.bulkWrite(variantUpdates, { session });
  }
  if (productUpdates.length > 0) {
    await Product.bulkWrite(productUpdates, { session });
  }
}

/**
 * Increment soldCount on products for completed orders.
 */
export async function incrementProductSales(items, session) {
  const bulkOps = items.map(item => ({
    updateOne: {
      filter: { _id: item.product?._id || item.product },
      update: { $inc: { soldCount: item.quantity } }
    }
  }));

  if (bulkOps.length > 0) {
    await Product.bulkWrite(bulkOps, { session });
  }
}
