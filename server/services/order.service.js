import { Variant } from '../models/variant.model.js';
import { Product } from '../models/product.model.js';
import { Cart } from '../models/cart.model.js';
import { Coupon } from '../models/coupon.model.js';
import { LedgerTransaction } from '../models/ledger.model.js';
import { ApiError, computeCartSubtotal, getUnitPrice } from '../utils/helpers.js';
import { calculateCouponDiscount } from './coupon.service.js';

const GST_TAX_RATE = 0.18;

export async function resolveVariant(item, session = null) {
  if (item.variant) {
    let q = Variant.findById(item.variant);
    if (session) q = q.session(session);
    return q;
  }

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

export async function deductStock(items, session) {
  const variantOps = [];
  const productOps = [];
  const productsToRecalculate = new Set();

  const sortedItems = [...items].sort((a, b) => {
    const idA = (a.variant?._id || a.variant || a.product?._id || a.product || '').toString();
    const idB = (b.variant?._id || b.variant || b.product?._id || b.product || '').toString();
    return idA.localeCompare(idB);
  });

  for (const item of sortedItems) {
    const productId = item.product?._id || item.product;
    const variant = await resolveVariant(item, session);

    if (variant) {
      if (variant.stock < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for "${item.title || 'item'}". It may have just sold out.`,
        );
      }
      variantOps.push({
        updateOne: {
          filter: { _id: variant._id, stock: { $gte: item.quantity } },
          update: { $inc: { stock: -item.quantity } },
        },
      });
      productsToRecalculate.add(productId.toString());
    } else {
      const product = await Product.findById(productId).session(session);
      if (!product || product.stock < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for "${item.title || 'item'}". It may have just sold out.`,
        );
      }
      productOps.push({
        updateOne: {
          filter: { _id: productId, stock: { $gte: item.quantity } },
          update: { $inc: { stock: -item.quantity } },
        },
      });
    }
  }

  if (variantOps.length > 0) {
    const result = await Variant.bulkWrite(variantOps, { session });
    if (result.matchedCount !== variantOps.length) {
      throw new ApiError(400, 'Some items became out of stock during checkout. Please try again.');
    }
  }

  if (productOps.length > 0) {
    const result = await Product.bulkWrite(productOps, { session });
    if (result.matchedCount !== productOps.length) {
      throw new ApiError(400, 'Some items became out of stock during checkout. Please try again.');
    }
  }

  if (productsToRecalculate.size > 0) {
    for (const prodId of productsToRecalculate) {
      await Product.recalculateVariantSummary(prodId, session);
    }
  }
}

export async function restoreStock(items, session) {
  const variantUpdates = [];
  const productUpdates = [];
  const productsToRecalculate = new Set();

  for (const item of items) {
    const variant = await resolveVariant(item, session);
    const productId = item.product?._id || item.product;
    if (variant) {
      variantUpdates.push({
        updateOne: {
          filter: { _id: variant._id },
          update: { $inc: { stock: item.quantity } },
        },
      });
      productsToRecalculate.add(productId.toString());
    } else {
      productUpdates.push({
        updateOne: {
          filter: { _id: productId },
          update: { $inc: { stock: item.quantity } },
        },
      });
    }
  }

  if (variantUpdates.length > 0) {
    await Variant.bulkWrite(variantUpdates, { session });
  }
  if (productUpdates.length > 0) {
    await Product.bulkWrite(productUpdates, { session });
  }

  if (productsToRecalculate.size > 0) {
    for (const prodId of productsToRecalculate) {
      await Product.recalculateVariantSummary(prodId, session);
    }
  }
}

export async function incrementProductSales(items, session) {
  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: { _id: item.product?._id || item.product },
      update: { $inc: { soldCount: item.quantity } },
    },
  }));

  if (bulkOps.length > 0) {
    await Product.bulkWrite(bulkOps, { session });
  }
}

export async function createLedgerEntries(
  orderId,
  orderNumber,
  orderItems,
  paymentMethod,
  session,
) {
  const vendorTotals = {};
  for (const item of orderItems) {
    if (item.vendor) {
      const vid = item.vendor.toString();
      if (!vendorTotals[vid]) vendorTotals[vid] = 0;
      vendorTotals[vid] += item.subtotal;
    }
  }

  const PLATFORM_FEE_PERCENTAGE = 0.1;
  const ledgerEntries = [];

  for (const [vendorId, vendorTotal] of Object.entries(vendorTotals)) {
    const saleAmountPaise = Math.round(vendorTotal * 100);
    ledgerEntries.push({
      seller: vendorId,
      type: 'sale',
      amount: saleAmountPaise,
      order: orderId,
      status: paymentMethod === 'cod' ? 'pending' : 'cleared',
      description: `Order Revenue - #${orderNumber}`,
    });

    const commissionAmountPaise = Math.round(vendorTotal * PLATFORM_FEE_PERCENTAGE * 100);
    ledgerEntries.push({
      seller: vendorId,
      type: 'commission_fee',
      amount: -commissionAmountPaise,
      order: orderId,
      status: paymentMethod === 'cod' ? 'pending' : 'cleared',
      description: `Platform Fee (10%) - #${orderNumber}`,
    });
  }

  if (ledgerEntries.length > 0) {
    await LedgerTransaction.insertMany(ledgerEntries, { session });
  }
}

export async function fetchAndValidateUserCart(userId) {
  const cart = await Cart.findOne({ user: userId })
    .populate({
      path: 'items.product',
      select: 'title price discountedPrice image stock seller variantSummary',
    })
    .populate({
      path: 'items.variant',
      select: 'sku stock optionValues price images',
    });

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Your cart is empty. Add items before checkout.');
  }

  const validItems = cart.items.filter((item) => item.product);
  if (validItems.length === 0) {
    throw new ApiError(400, 'Cart contains invalid products.');
  }

  return cart;
}

export async function calculateOrderTotals(cart, couponCode, userId) {
  const validItems = cart.items.filter((item) => item.product);
  const subtotal = computeCartSubtotal(validItems);

  let discountAmount = 0;
  let taxableValue = subtotal;
  let appliedCouponCode;
  let appliedCouponId;

  if (couponCode?.trim()) {
    const couponResult = await calculateCouponDiscount(couponCode, subtotal, validItems, userId);
    discountAmount = couponResult.discountAmount;
    taxableValue = couponResult.finalTotal;
    appliedCouponCode = couponResult.code;

    const couponDoc = await Coupon.findOne({ code: appliedCouponCode });
    if (couponDoc) {
      appliedCouponId = couponDoc._id;
    }
  }

  const taxAmount = taxableValue * GST_TAX_RATE;
  const total = taxableValue + taxAmount;

  const orderItems = validItems.map((item) => {
    const product = item.product;
    const variant = item.variant;
    const unitPrice = variant?.price ?? getUnitPrice(product);
    return {
      product: product._id,
      variant: variant?._id || null,
      sku: variant?.sku || '',
      vendor: product.seller,
      title: product.title,
      image: product.image,
      price: variant?.price ?? product.price,
      discountedPrice: variant?.compareAtPrice ?? product.discountedPrice,
      quantity: item.quantity,
      unitPrice,
      subtotal: unitPrice * item.quantity,
      size: item.size || '',
      color: item.color || '',
      status: 'confirmed',
    };
  });

  return {
    subtotal,
    taxAmount,
    discountAmount,
    total,
    orderItems,
    appliedCouponId,
    appliedCouponCode,
  };
}
