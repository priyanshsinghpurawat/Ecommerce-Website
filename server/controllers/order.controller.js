import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';
import { Cart } from '../models/cart.model.js';
import { Product } from '../models/product.model.js';
import { Coupon } from '../models/coupon.model.js';
import { User } from '../models/user.model.js';
import {
  asyncHandler,
  ApiError,
  ApiResponse,
  calculateCouponDiscount,
  computeCartSubtotal,
  getUnitPrice,
  generateOrderNumber,
  validateShippingAddress
} from '../utils/helpers.js';

const GST_TAX_RATE = 0.18;
const VALID_ORDER_STATUSES = ['confirmed', 'partially_shipped', 'shipped', 'delivered', 'cancelled'];

/* -------------------------------------------------------------------------- */
/*                                 CONTROLLERS                                */
/* -------------------------------------------------------------------------- */

/**
 * @desc    Place order from cart
 * @route   POST /api/v1/orders
 * @access  Private
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, couponCode, paymentMethod = 'cod' } = req.body;

  validateShippingAddress(shippingAddress);

  const cart = await fetchAndValidateUserCart(req.user._id);
  const orderCalculations = await calculateOrderTotals(cart, couponCode, req.user._id);
  
  const order = await executeOrderTransaction({
    userId: req.user._id,
    cart,
    orderCalculations,
    shippingAddress,
    paymentMethod
  });

  return res
    .status(201)
    .json(new ApiResponse(201, order, 'Order placed successfully'));
});

/**
 * @desc    Get logged-in user's orders
 * @route   GET /api/v1/orders/my
 * @access  Private
 */
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, orders, 'Orders retrieved successfully'));
});

/**
 * @desc    Get single order by id
 * @route   GET /api/v1/orders/:id
 * @access  Private
 */
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (!isAuthorizedToViewOrder(order, req.user)) {
    throw new ApiError(403, 'You are not authorized to view this order');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, order, 'Order retrieved successfully'));
});

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/v1/orders
 * @access  Private/Admin
 */
export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const sellerId = req.user.role === 'seller' ? req.user._id.toString() : req.query.seller;
  
  const query = buildOrderQuery({ status, search });

  if (sellerId) {
    const sellerProducts = await Product.find({ seller: sellerId }).distinct('_id');
    query['items.product'] = { $in: sellerProducts };
  }

  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, orders, 'All orders retrieved successfully'));
});

/**
 * @desc    Update order status (Admin)
 * @route   PATCH /api/v1/orders/:id/status
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

  // If user is a seller, they can only update their own items
  if (req.user.role === 'seller') {
    if (itemId) {
      const item = order.items.id(itemId);
      if (!item) throw new ApiError(404, 'Item not found in order');
      if (item.vendor.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'You are not authorized to update this item');
      }
      await transitionOrderItemStatus(order, item, status, trackingNumber);
    } else {
      // Update all items belonging to this seller
      let updatedAny = false;
      for (const item of order.items) {
        if (item.vendor.toString() === req.user._id.toString()) {
          await transitionOrderItemStatus(order, item, status, trackingNumber);
          updatedAny = true;
        }
      }
      if (!updatedAny) throw new ApiError(403, 'No items found for this vendor in this order');
    }
  } else if (req.user.role === 'admin') {
    // Admin can update specific item or whole order
    if (itemId) {
      const item = order.items.id(itemId);
      if (!item) throw new ApiError(404, 'Item not found in order');
      await transitionOrderItemStatus(order, item, status, trackingNumber);
    } else {
      await transitionOrderStatus(order, status);
    }
  } else {
    throw new ApiError(403, 'You are not authorized to update order status');
  }

  // Recalculate root order status
  recalculateRootOrderStatus(order);
  await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, order, 'Order status updated successfully'));
});

/**
 * @desc    Get order analytics for dashboard (Admin)
 * @route   GET /api/v1/orders/analytics
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


/* -------------------------------------------------------------------------- */
/*                               PRIVATE HELPERS                              */
/* -------------------------------------------------------------------------- */

async function fetchAndValidateUserCart(userId) {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'title price discountedPrice image stock seller'
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

async function calculateOrderTotals(cart, couponCode, userId) {
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
    const unitPrice = getUnitPrice(product);
    return {
      product: product._id,
      vendor: product.seller,
      title: product.title,
      image: product.image,
      price: product.price,
      discountedPrice: product.discountedPrice,
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

async function executeOrderTransaction({ userId, cart, orderCalculations, shippingAddress, paymentMethod }) {
  const { subtotal, taxAmount, discountAmount, total, orderItems, appliedCouponId, appliedCouponCode } = orderCalculations;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Acquire lock on user to prevent concurrent checkout race conditions (Bug #7)
    await User.findByIdAndUpdate(userId, { $set: { updatedAt: new Date() } }, { session });

    const validItems = cart.items.filter((item) => item.product);
    await deductProductStock(validItems, session);

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
      status: 'confirmed'
    }], { session });

    await incrementProductSales(orderItems, session);
    await incrementCouponUsage(appliedCouponId, session);

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

async function deductProductStock(items, session) {
  for (const item of items) {
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: item.product._id, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true, session }
    );

    if (!updatedProduct) {
      throw new ApiError(
        400,
        `Insufficient stock for "${item.product.title}". It might have just sold out.`
      );
    }
  }
}

async function incrementProductSales(items, session) {
  for (const item of items) {
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { soldCount: item.quantity } },
      { session }
    );
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

function isAuthorizedToViewOrder(order, user) {
  return order.user._id.toString() === user._id.toString() || user.role === 'admin';
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

async function transitionOrderStatus(order, newStatus) {
  const oldStatus = order.status;

  if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
    await restoreStockForOrder(order);
  }

  if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
    await reDeductStockForOrder(order);
  }

  // Update all items to match root status
  for (const item of order.items) {
    item.status = newStatus;
  }
}

async function transitionOrderItemStatus(order, item, newStatus, trackingNumber) {
  const oldStatus = item.status;

  if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, soldCount: -item.quantity }
    });
  }

  if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
    const product = await Product.findById(item.product);
    if (!product || product.stock < item.quantity) {
      throw new ApiError(400, `Cannot reinstate item. Product "${item.title}" is out of stock.`);
    }
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity, soldCount: item.quantity }
    });
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

async function restoreStockForOrder(order) {
  for (const item of order.items) {
    if (item.status !== 'cancelled') {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, soldCount: -item.quantity }
      });
      item.status = 'cancelled';
    }
  }
}

async function reDeductStockForOrder(order) {
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (!product || product.stock < item.quantity) {
      throw new ApiError(400, `Cannot reinstate order. Product "${item.title}" is out of stock.`);
    }
  }
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity, soldCount: item.quantity }
    });
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
