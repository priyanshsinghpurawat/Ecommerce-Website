import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';
import { Cart } from '../models/cart.model.js';
import { Product } from '../models/product.model.js';
import { Coupon } from '../models/coupon.model.js';
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

/**
 * @desc    Place order from cart
 * @route   POST /api/v1/orders
 * @access  Private
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, couponCode, paymentMethod = 'cod' } = req.body;

  validateShippingAddress(shippingAddress);

  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'items.product',
    select: 'title price discountedPrice image stock'
  });

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Your cart is empty. Add items before checkout.');
  }

  const validItems = cart.items.filter((item) => item.product);
  if (validItems.length === 0) {
    throw new ApiError(400, 'Cart contains invalid products.');
  }

  const subtotal = computeCartSubtotal(validItems);

  let discountAmount = 0;
  let taxableValue = subtotal;
  let appliedCouponCode;
  let appliedCouponId;

  if (couponCode?.trim()) {
    const couponResult = await calculateCouponDiscount(couponCode, subtotal, validItems, req.user._id);
    discountAmount = couponResult.discountAmount;
    taxableValue = couponResult.finalTotal;
    appliedCouponCode = couponResult.code;

    // Find the coupon ID to increment usage
    const couponDoc = await Coupon.findOne({ code: appliedCouponCode });
    if (couponDoc) {
      appliedCouponId = couponDoc._id;
    }
  }

  const taxAmount = taxableValue * 0.18; // 18% GST
  const total = taxableValue + taxAmount;

  const orderItems = validItems.map((item) => {
    const product = item.product;
    const unitPrice = getUnitPrice(product);
    return {
      product: product._id,
      title: product.title,
      image: product.image,
      price: product.price,
      discountedPrice: product.discountedPrice,
      quantity: item.quantity,
      unitPrice,
      subtotal: unitPrice * item.quantity,
      size: item.size || '',
      color: item.color || ''
    };
  });

  // Transactional stock check and decrement
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const item of validItems) {
      const product = await Product.findOneAndUpdate(
        { _id: item.product._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true, session }
      );

      if (!product) {
        throw new ApiError(
          400,
          `Insufficient stock for "${item.product.title}". It might have just sold out.`
        );
      }
    }

    const [order] = await Order.create([{
      orderNumber: generateOrderNumber(),
      user: req.user._id,
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

    // Increment soldCount for products after successful order creation
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { soldCount: item.quantity } }, { session });
    }

    // Increment coupon usage count
    if (appliedCouponId) {
      await Coupon.findByIdAndUpdate(appliedCouponId, { $inc: { usageCount: 1 } }, { session });
    }

    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    const populatedOrder = await Order.findById(order._id).populate('user', 'name email');

    return res
      .status(201)
      .json(new ApiResponse(201, populatedOrder, 'Order placed successfully'));

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
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

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
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
  let { seller } = req.query;
  const query = {};

  // If user is a seller, they can ONLY see their own products' orders
  if (req.user.role === 'seller') {
    seller = req.user._id.toString();
  }

  if (status && status !== 'all') {
    query.status = status;
  }

  if (search) {
    const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.orderNumber = { $regex: escaped, $options: 'i' };
  }

  if (seller) {
    const sellerProducts = await Product.find({ seller }).distinct('_id');
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
  const { status } = req.body;

  const validStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, 'Invalid order status');
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const oldStatus = order.status;

  // 1. Transitioning TO cancelled: Restore stock & decrement soldCount
  if (status === 'cancelled' && oldStatus !== 'cancelled') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, soldCount: -item.quantity }
      });
    }
  }

  // 2. Transitioning FROM cancelled back to active: Re-deduct stock & increment soldCount
  if (oldStatus === 'cancelled' && status !== 'cancelled') {
    // Atomic check for all items first
    for (const item of order.items) {
      const p = await Product.findById(item.product);
      if (!p || p.stock < item.quantity) {
        throw new ApiError(400, `Cannot reinstate order. Product "${item.title}" is out of stock.`);
      }
    }
    // Now decrement
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, soldCount: item.quantity }
      });
    }
  }

  order.status = status;
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
    // 1. Daily Revenue (Last 30 Days)
    Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          createdAt: { $gte: thirtyDaysAgo }
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
    ]),

    // 2. Top-Selling Subcategories
    Order.aggregate([
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
    ]),

    // 3. Peak Ordering Hours
    Order.aggregate([
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { dailyRevenue, categoryPerformance, peakHours }, 'Analytics retrieved successfully'));
});

