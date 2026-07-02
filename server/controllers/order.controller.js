import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';
import { Cart } from '../models/cart.model.js';
import { Product } from '../models/product.model.js';
import { Variant } from '../models/variant.model.js';
import { Coupon } from '../models/coupon.model.js';
import { User } from '../models/user.model.js';
import { AffiliateLink } from '../models/affiliateLink.model.js';
import { LedgerTransaction } from '../models/ledger.model.js';
import Papa from 'papaparse';
import logger from '../config/logger.js';
import { ApiResponse, ApiError, asyncHandler, calculateCouponDiscount, computeCartSubtotal, getUnitPrice, generateOrderNumber, validateShippingAddress } from '../utils/helpers.js';
import { getIO } from '../config/socket.js';
import { deductStock, incrementProductSales as incrementSalesBulk } from '../services/order.service.js';

const GST_TAX_RATE = 0.18;
const VALID_ORDER_STATUSES = ['confirmed', 'partially_shipped', 'shipped', 'delivered', 'cancelled'];

// State machine: defines which transitions are allowed from each status
const VALID_TRANSITIONS = {
  confirmed:        ['shipped', 'cancelled'],
  partially_shipped:['shipped', 'cancelled'],
  shipped:          ['delivered', 'cancelled'],
  delivered:        [],                        // terminal state
  cancelled:        ['confirmed'],             // reinstatement (requires stock check)
};

/* -------------------------------------------------------------------------- */
/*                                 CONTROLLERS                                */
/* -------------------------------------------------------------------------- */

/**
 * @desc    Place order from cart
 * @route   POST /api/v3/orders
 * @access  Private
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, couponCode, paymentMethod = 'cod', attributionTag } = req.body;

  validateShippingAddress(shippingAddress);

  const order = await executeOrderTransaction({
    userId: req.user._id,
    couponCode,
    shippingAddress,
    paymentMethod,
    attributionTag
  });

  return res
    .status(201)
    .json(new ApiResponse(201, order, 'Order placed successfully'));
});

/**
 * @desc    Get logged-in user's orders
 * @route   GET /api/v3/orders/my
 * @access  Private
 */
export const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Order.countDocuments({ user: req.user._id })
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, {
      orders,
      pagination: {
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        limit: limitNum
      }
    }, 'Orders retrieved successfully'));
});

/**
 * @desc    Get single order by id
 * @route   GET /api/v3/orders/:id
 * @access  Private
 */
export const getOrderById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };

  if (req.user.role === 'user') {
    filter.user = req.user._id;
  } else if (req.user.role === 'seller') {
    filter['items.seller'] = req.user._id;
  }

  const order = await Order.findOne(filter).populate('user', 'name email').lean();

  if (!order) {
    throw new ApiError(404, 'Order not found or you are not authorized to view it');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, order, 'Order retrieved successfully'));
});

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/v3/orders
 * @access  Private/Admin
 */
export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 50 } = req.query;
  const sellerId = req.user.role === 'seller' ? req.user._id.toString() : req.query.seller;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * limitNum;
  
  const query = buildOrderQuery({ status, search });

  if (sellerId) {
    const sellerProducts = await Product.find({ seller: sellerId }).distinct('_id');
    query['items.product'] = { $in: sellerProducts };
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Order.countDocuments(query)
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, {
      orders,
      pagination: {
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        limit: limitNum
      }
    }, 'All orders retrieved successfully'));
});

/**
 * @desc    Update order status (Admin)
 * @route   PATCH /api/v3/orders/:id/status
 * @access  Private/Admin
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, itemId, trackingNumber } = req.body;

  validateOrderStatus(status);

  const order = await Order.findById(id).populate('items.product', 'seller');
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // If user is a seller, they can only update their own items
    if (req.user.role === 'seller') {
      if (itemId) {
        const item = order.items.id(itemId);
        if (!item) throw new ApiError(404, 'Item not found in order');
        if (item.seller.toString() !== req.user._id.toString()) {
          throw new ApiError(403, 'You are not authorized to update this item');
        }
        await transitionOrderItemStatus(order, item, status, trackingNumber, session);
      } else {
        let updatedAny = false;
        for (const item of order.items) {
          if (item.seller.toString() === req.user._id.toString()) {
            await transitionOrderItemStatus(order, item, status, trackingNumber, session);
            updatedAny = true;
          }
        }
        if (!updatedAny) throw new ApiError(403, 'No items found for this seller in this order');
      }
    } else if (req.user.role === 'admin') {
      if (itemId) {
        const item = order.items.id(itemId);
        if (!item) throw new ApiError(404, 'Item not found in order');
        await transitionOrderItemStatus(order, item, status, trackingNumber, session);
      } else {
        await transitionOrderStatus(order, status, session);
      }
    } else {
      throw new ApiError(403, 'You are not authorized to update order status');
    }

    recalculateRootOrderStatus(order);
    await order.save({ session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  try {
    const io = getIO();
    io.to(order.user.toString()).emit('orderStatusUpdated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      items: order.items
    });
  } catch (err) {
    logger.error('Socket emission failed:', err.message);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, order, 'Order status updated successfully'));
});

/**
 * @desc    Get order analytics for dashboard (Admin)
 * @route   GET /api/v3/orders/analytics
 * @access  Private/Admin
 */
export const getOrderAnalytics = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [dailyRevenue, categoryPerformance, peakHours] = await Promise.all([
    fetchDailyRevenue(thirtyDaysAgo),
    fetchCategoryPerformance(),
    fetchPeakOrderingHours()
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { dailyRevenue, categoryPerformance, peakHours }, 'Analytics retrieved successfully'));
});

/**
 * @desc    Request a return for an order item (Customer)
 * @route   POST /api/v3/orders/:id/items/:itemId/return
 * @access  Private
 */
export const requestReturn = asyncHandler(async (req, res) => {
  const { id, itemId } = req.params;
  const { reason } = req.body;

  if (!reason) throw new ApiError(400, 'Return reason is required');

  const order = await Order.findOne({ _id: id, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');

  const item = order.items.id(itemId);
  if (!item) throw new ApiError(404, 'Item not found in order');

  if (item.status !== 'delivered') {
    throw new ApiError(400, 'Only delivered items can be returned');
  }
  if (item.returnStatus !== 'none') {
    throw new ApiError(400, 'Return already requested for this item');
  }

  // Check 7-day return policy (PM SLA enforcement)
  const deliveryDate = item.deliveryDate || order.updatedAt;
  const daysSinceDelivery = (new Date() - new Date(deliveryDate)) / (1000 * 60 * 60 * 24);
  if (daysSinceDelivery > 7) {
    throw new ApiError(400, 'Return window (7 days) has expired');
  }

  item.returnStatus = 'requested';
  item.returnReason = reason;

  await order.save();

  return res.status(200).json(new ApiResponse(200, order, 'Return requested successfully'));
});

/**
 * @desc    Process a return request (Approve/Reject)
 * @route   PUT /api/v3/orders/:id/items/:itemId/process-return
 * @access  Private (Seller/Admin)
 */
export const processReturn = asyncHandler(async (req, res) => {
  const { id, itemId } = req.params;
  const { status } = req.body; // 'approved', 'rejected', 'refunded'

  if (!['approved', 'rejected', 'refunded'].includes(status)) {
    throw new ApiError(400, 'Invalid return status');
  }

  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, 'Order not found');

  const item = order.items.id(itemId);
  if (!item) throw new ApiError(404, 'Item not found in order');

  // Verify authorization
  if (req.user.role === 'seller' && item.seller?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to process this return');
  }

  if (item.returnStatus !== 'requested' && item.returnStatus !== 'approved') {
    throw new ApiError(400, 'Cannot process return in current state');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    item.returnStatus = status;
    
    if (status === 'refunded') {
      item.status = 'returned';
      // In a real system, we would trigger Razorpay refund API here.
      
      // Reverse Ledger Transaction
      const saleAmountPaise = Math.round(item.subtotal * 100);
      const commissionAmountPaise = Math.round(item.subtotal * 0.10 * 100);
      
      await LedgerTransaction.insertMany([
        {
          seller: item.seller,
          type: 'refund',
          amount: -saleAmountPaise, // deduct sale
          order: order._id,
          description: `Refund (RMA) - #${order.orderNumber}`
        },
        {
          seller: item.seller,
          type: 'commission_fee', // Revert fee
          amount: commissionAmountPaise, // credit back the platform fee
          order: order._id,
          description: `Fee Reversal (RMA) - #${order.orderNumber}`
        }
      ], { session });

      // Restore stock
      await restoreStockForOrder({ items: [item] }, session);
    }

    recalculateRootOrderStatus(order);
    await order.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(new ApiResponse(200, order, `Return ${status} successfully`));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

/**
 * @desc    Export orders to CSV (Admin)
 * @route   GET /api/v3/orders/export/csv
 * @access  Private/Admin
 */
export const exportOrdersCSV = asyncHandler(async (req, res) => {
  res.header('Content-Type', 'text/csv');
  res.attachment('sales_report.csv');
  
  const headers = ['OrderNumber', 'Date', 'CustomerName', 'CustomerEmail', 'Status', 'ItemsCount', 'Subtotal', 'Tax', 'Discount', 'Total', 'PaymentMethod'];
  res.write(Papa.unparse([headers], { header: false }) + '\n');
  
  const cursor = Order.find({ status: { $ne: 'cancelled' } })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .cursor();
    
  for await (const o of cursor) {
    const row = [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString(),
      o.user?.name || 'Guest',
      o.user?.email || 'N/A',
      o.status,
      o.items.reduce((sum, i) => sum + i.quantity, 0),
      o.subtotal,
      o.taxAmount,
      o.discountAmount,
      o.total,
      o.paymentMethod
    ];
    res.write(Papa.unparse([row], { header: false }) + '\n');
  }
  
  res.end();
});

/* -------------------------------------------------------------------------- */
/*                               PRIVATE HELPERS                              */
/* -------------------------------------------------------------------------- */

export async function fetchAndValidateUserCart(userId, session = null) {
  let query = Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'title price discountedPrice image stock seller variantSummary'
  }).populate({
    path: 'items.variant',
    select: 'sku stock optionValues price images'
  });
  
  if (session) query = query.session(session);
  const cart = await query;

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Your cart is empty. Add items before checkout.');
  }

  const validItems = cart.items.filter((item) => item.product);
  if (validItems.length === 0) {
    throw new ApiError(400, 'Cart contains invalid products.');
  }

  return cart;
}

export async function calculateOrderTotals(cart, couponCode, userId, session = null) {
  const validItems = cart.items.filter((item) => item.product);
  const subtotal = computeCartSubtotal(validItems);

  let discountAmount = 0;
  let taxableValue = subtotal;
  let appliedCouponCode;
  let appliedCouponId;

  if (couponCode?.trim()) {
    const couponResult = await calculateCouponDiscount(couponCode, subtotal, validItems, userId, session);
    discountAmount = couponResult.discountAmount;
    taxableValue = couponResult.finalTotal;
    appliedCouponCode = couponResult.code;

    let couponQuery = Coupon.findOne({ code: appliedCouponCode });
    if (session) couponQuery = couponQuery.session(session);
    const couponDoc = await couponQuery;
    
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
      seller: product.seller,
      title: product.title,
      image: product.image,
      price: variant?.price ?? product.price,
      discountedPrice: variant?.compareAtPrice ?? product.discountedPrice,
      quantity: item.quantity,
      unitPrice,
      subtotal: unitPrice * item.quantity,
      size: item.size || '',
      color: item.color || '',
      status: 'confirmed'
    };
  });

  return {
    subtotal,
    taxAmount,
    discountAmount,
    total,
    orderItems,
    appliedCouponId,
    appliedCouponCode
  };
}

async function executeOrderTransaction({ userId, couponCode, shippingAddress, paymentMethod, attributionTag }) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Acquire lock on user to prevent concurrent checkout race conditions (Bug #7)
    await User.findByIdAndUpdate(userId, { $set: { updatedAt: new Date() } }, { session });

    const cart = await fetchAndValidateUserCart(userId, session);
    const orderCalculations = await calculateOrderTotals(cart, couponCode, userId, session);
    const { subtotal, taxAmount, discountAmount, total, orderItems, appliedCouponId, appliedCouponCode } = orderCalculations;

    const validItems = cart.items.filter((item) => item.product);
    await deductStock(validItems, session);

    const [order] = await Order.create([{
      orderNumber: generateOrderNumber(),
      user: userId,
      items: orderItems,
      subtotal,
      taxAmount,
      discountAmount,
      total,
      coupon: appliedCouponId,
      couponCode: appliedCouponCode,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        street: shippingAddress.street.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        zipCode: shippingAddress.zipCode.trim(),
        country: shippingAddress.country?.trim() || 'India'
      },
      paymentMethod: paymentMethod === 'demo' ? 'demo' : 'cod',
      status: 'confirmed',
      attributionTag: attributionTag || null
    }], { session });

    await incrementSalesBulk(orderItems, session);
    await incrementCouponUsage(appliedCouponId, session);
    
    // Update affiliate metrics if an attribution tag exists
    if (attributionTag) {
      await AffiliateLink.findOneAndUpdate(
        { trackingTag: attributionTag.toLowerCase(), isActive: true },
        { 
          $inc: { 
            'metrics.conversions': 1, 
            'metrics.revenueGenerated': total 
          } 
        },
        { session }
      );
    }

    // Process Ledger Transactions (Billing & Commissions) using strict integer math (paise)
    const sellerTotals = {};
    for (const item of orderItems) {
      if (item.seller) {
        const vid = item.seller.toString();
        if (!sellerTotals[vid]) sellerTotals[vid] = 0;
        sellerTotals[vid] += item.subtotal;
      }
    }

    const PLATFORM_FEE_PERCENTAGE = 0.10; // 10% flat fee
    const ledgerEntries = [];
    
    for (const [sellerId, sellerTotal] of Object.entries(sellerTotals)) {
      // 1. Credit Seller for the sale (in paise)
      const saleAmountPaise = Math.round(sellerTotal * 100);
      ledgerEntries.push({
        seller: sellerId,
        type: 'sale',
        amount: saleAmountPaise,
        order: order._id,
        status: paymentMethod === 'cod' ? 'pending' : 'cleared',
        description: `Order Revenue - #${order.orderNumber}`
      });

      // 2. Debit Platform Commission (in paise)
      const commissionAmountPaise = Math.round(sellerTotal * PLATFORM_FEE_PERCENTAGE * 100);
      ledgerEntries.push({
        seller: sellerId,
        type: 'commission_fee',
        amount: -commissionAmountPaise, // negative amount for debits
        order: order._id,
        status: paymentMethod === 'cod' ? 'pending' : 'cleared',
        description: `Platform Fee (10%) - #${order.orderNumber}`
      });
    }

    if (ledgerEntries.length > 0) {
      await LedgerTransaction.insertMany(ledgerEntries, { session });
    }

    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    return Order.findById(order._id).populate('user', 'name email');
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

async function incrementCouponUsage(couponId, session) {
  if (couponId) {
    await Coupon.findByIdAndUpdate(
      couponId,
      { $inc: { usageCount: 1 } },
      { session }
    );
  }
}

function buildOrderQuery({ status, search }) {
  const query = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  if (search) {
    const escapedSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.orderNumber = { $regex: escapedSearch, $options: 'i' };
  }

  return query;
}

function validateOrderStatus(status) {
  if (!VALID_ORDER_STATUSES.includes(status)) {
    throw new ApiError(400, 'Invalid order status');
  }
}

function assertValidTransition(oldStatus, newStatus) {
  if (oldStatus === newStatus) return; // no-op is fine
  const allowed = VALID_TRANSITIONS[oldStatus];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new ApiError(
      400,
      `Invalid status transition: '${oldStatus}' → '${newStatus}'. Allowed: ${(allowed || []).join(', ') || 'none (terminal state)'}`
    );
  }
}

async function transitionOrderStatus(order, newStatus, session) {
  const oldStatus = order.status;
  assertValidTransition(oldStatus, newStatus);

  if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
    await restoreStockForOrder(order, session);
  }

  if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
    await reDeductStockForOrder(order, session);
  }

  for (const item of order.items) {
    item.status = newStatus;
  }
}

async function transitionOrderItemStatus(order, item, newStatus, trackingNumber, session) {
  const oldStatus = item.status;
  assertValidTransition(oldStatus, newStatus);

  const opts = session ? { session } : {};

  // Resolve variant for this item
  let variant = null;
  if (item.variant) {
    variant = await Variant.findById(item.variant).session(session);
  } else if (item.sku) {
    variant = await Variant.findOne({ sku: item.sku, deletedAt: null }).session(session);
  } else if (item.color || item.size) {
    const query = { product: item.product, deletedAt: null };
    if (item.color) query['optionValues.Color'] = item.color;
    if (item.size) query['optionValues.Size'] = item.size;
    variant = await Variant.findOne(query).session(session);
  }

  if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
    if (variant) {
      await Variant.findOneAndUpdate(
        { _id: variant._id },
        { $inc: { stock: item.quantity } },
        opts
      );
      await Product.recalculateVariantSummary(item.product, session);
    } else {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, soldCount: -item.quantity }
      }, opts);
    }
  }

  if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
    let updated;
    if (variant) {
      updated = await Variant.findOneAndUpdate(
        { _id: variant._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true, ...opts }
      );
      await Product.recalculateVariantSummary(item.product, session);
    } else {
      updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity, soldCount: item.quantity } },
        { new: true, ...opts }
      );
    }
    if (!updated) {
      throw new ApiError(400, `Cannot reinstate item. Product "${item.title}" is out of stock.`);
    }
  }

  item.status = newStatus;
  if (trackingNumber) item.trackingNumber = trackingNumber;
  if (newStatus === 'delivered') item.deliveryDate = new Date();
}

function recalculateRootOrderStatus(order) {
  const itemStatuses = order.items.map(i => i.status);
  
  if (itemStatuses.every(s => s === 'cancelled')) {
    order.status = 'cancelled';
  } else if (itemStatuses.every(s => s === 'delivered' || s === 'cancelled')) {
    order.status = 'delivered';
  } else if (itemStatuses.every(s => s === 'shipped' || s === 'delivered' || s === 'cancelled')) {
    order.status = 'shipped';
  } else if (itemStatuses.some(s => s === 'shipped' || s === 'delivered')) {
    order.status = 'partially_shipped';
  } else {
    order.status = 'confirmed';
  }
}

async function restoreStockForOrder(order, session) {
  const sortedItems = [...order.items].sort((a, b) =>
    (a.product?.toString() || '').localeCompare(b.product?.toString() || '')
  );
  const productsToRecalculate = new Set();

  for (const item of sortedItems) {
    if (item.status !== 'cancelled') {
      // Resolve variant
      let variant = null;
      if (item.variant) {
        variant = await Variant.findById(item.variant).session(session);
      } else if (item.sku) {
        variant = await Variant.findOne({ sku: item.sku, deletedAt: null }).session(session);
      } else if (item.color || item.size) {
        const query = { product: item.product, deletedAt: null };
        if (item.color) query['optionValues.Color'] = item.color;
        if (item.size) query['optionValues.Size'] = item.size;
        variant = await Variant.findOne(query).session(session);
      }

      if (variant) {
        await Variant.findOneAndUpdate(
          { _id: variant._id },
          { $inc: { stock: item.quantity } },
          session ? { session } : {}
        );
        productsToRecalculate.add(item.product.toString());
      } else {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, soldCount: -item.quantity }
        }, session ? { session } : {});
      }
      
      // Preserve 'returned' status for refunded items instead of overwriting to 'cancelled'
      if (item.status !== 'returned') {
        item.status = 'cancelled';
      }
    }
  }

  for (const prodId of productsToRecalculate) {
    await Product.recalculateVariantSummary(prodId, session);
  }
}

async function reDeductStockForOrder(order, session) {
  const sortedItems = [...order.items].sort((a, b) =>
    (a.product?.toString() || '').localeCompare(b.product?.toString() || '')
  );
  const productsToRecalculate = new Set();

  for (const item of sortedItems) {
    // Resolve variant
    let variant = null;
    if (item.variant) {
      variant = await Variant.findById(item.variant).session(session);
    } else if (item.sku) {
      variant = await Variant.findOne({ sku: item.sku, deletedAt: null }).session(session);
    } else if (item.color || item.size) {
      const query = { product: item.product, deletedAt: null };
      if (item.color) query['optionValues.Color'] = item.color;
      if (item.size) query['optionValues.Size'] = item.size;
      variant = await Variant.findOne(query).session(session);
    }

    const opts = { new: true, ...(session ? { session } : {}) };
    let updated;
    if (variant) {
      updated = await Variant.findOneAndUpdate(
        { _id: variant._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        opts
      );
      productsToRecalculate.add(item.product.toString());
    } else {
      updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity, soldCount: item.quantity } },
        opts
      );
    }

    if (!updated) {
      // Rollback any items already deducted in this loop
      const deductedItems = sortedItems.slice(0, sortedItems.indexOf(item));
      const rollbackProducts = new Set();
      for (const prev of deductedItems) {
        let prevVariant = null;
        if (prev.variant) {
          prevVariant = await Variant.findById(prev.variant).session(session);
        } else if (prev.sku) {
          prevVariant = await Variant.findOne({ sku: prev.sku, deletedAt: null }).session(session);
        } else if (prev.color || prev.size) {
          const q = { product: prev.product, deletedAt: null };
          if (prev.color) q['optionValues.Color'] = prev.color;
          if (prev.size) q['optionValues.Size'] = prev.size;
          prevVariant = await Variant.findOne(q).session(session);
        }

        if (prevVariant) {
          await Variant.findOneAndUpdate(
            { _id: prevVariant._id },
            { $inc: { stock: prev.quantity } },
            session ? { session } : {}
          );
          rollbackProducts.add(prev.product.toString());
        } else {
          await Product.findByIdAndUpdate(prev.product, {
            $inc: { stock: prev.quantity, soldCount: -prev.quantity }
          }, session ? { session } : {});
        }
      }
      for (const prodId of rollbackProducts) {
        await Product.recalculateVariantSummary(prodId, session);
      }
      throw new ApiError(400, `Cannot reinstate order. Product "${item.title}" is out of stock.`);
    }
  }

  for (const prodId of productsToRecalculate) {
    await Product.recalculateVariantSummary(prodId, session);
  }
}

async function fetchDailyRevenue(fromDate) {
  return Order.aggregate([
    {
      $match: {
        status: { $ne: 'cancelled' },
        createdAt: { $gte: fromDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
}

async function fetchCategoryPerformance() {
  return Order.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productDoc"
      }
    },
    { $unwind: "$productDoc" },
    {
      $lookup: {
        from: "subcategories",
        localField: "productDoc.subcategory",
        foreignField: "_id",
        as: "subcategoryDoc"
      }
    },
    { $unwind: { path: "$subcategoryDoc", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ["$subcategoryDoc.name", "Uncategorized"] },
        sales: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.subtotal" }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 }
  ]);
}

async function fetchPeakOrderingHours() {
  return Order.aggregate([
    {
      $group: {
        _id: { $hour: "$createdAt" },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
}
