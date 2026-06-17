import crypto from 'crypto';
import Razorpay from 'razorpay';
import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { Cart } from '../models/cart.model.js';
import { Coupon } from '../models/coupon.model.js';
import { User } from '../models/user.model.js';
import { asyncHandler, ApiError, ApiResponse, buildOrderFromCart, generateOrderNumber } from '../utils/helpers.js';

const isRazorpayConfigured = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return false;
  if (keyId.includes('your_') || keySecret.includes('your_')) return false;
  return true;
};

export const getPaymentConfig = asyncHandler(async (req, res) => {
  const enabled = isRazorpayConfigured();
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        razorpayEnabled: enabled,
        keyId: enabled ? process.env.RAZORPAY_KEY_ID : null
      },
      'Payment config'
    )
  );
});

const getRazorpay = () => {
  if (!isRazorpayConfigured()) {
    throw new ApiError(
      503,
      'Online payment is not configured. Use Cash on Delivery instead.'
    );
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

export const createCheckout = asyncHandler(async (req, res) => {
  const { shippingAddress, couponCode } = req.body;
  const built = await buildOrderFromCart(req.user._id, { shippingAddress, couponCode });

  // Transactionally reserve stock up-front to prevent overselling
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Acquire lock on user to prevent checkout race conditions (Bug #7)
    await User.findByIdAndUpdate(req.user._id, { $set: { updatedAt: new Date() } }, { session });

    let appliedCouponId = null;
    if (built.appliedCouponCode) {
      const couponDoc = await Coupon.findOne({ code: built.appliedCouponCode });
      if (couponDoc) {
        appliedCouponId = couponDoc._id;
      }
    }

    for (const item of built.orderItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true, session }
      );
      if (!updated) {
        throw new ApiError(400, `Insufficient stock for "${item.title}". It may have just sold out.`);
      }
    }

    const [order] = await Order.create([{
      orderNumber: generateOrderNumber(),
      user: req.user._id,
      items: built.orderItems,
      subtotal: built.subtotal,
      taxAmount: built.taxAmount,
      discountAmount: built.discountAmount,
      total: built.total,
      coupon: appliedCouponId,
      couponCode: built.appliedCouponCode,
      shippingAddress: built.shippingAddress,
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      status: 'pending'
    }], { session });

    const razorpay = getRazorpay();
    const amountPaise = Math.round(built.total * 100);

    const rzOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: order._id.toString(),
      notes: { orderNumber: order.orderNumber }
    });

    order.razorpayOrderId = rzOrder.id;
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(
      new ApiResponse(201, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: built.total,
        amountPaise,
        razorpayOrderId: rzOrder.id,
        keyId: process.env.RAZORPAY_KEY_ID
      }, 'Checkout ready')
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    orderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;

  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, 'Payment verification fields missing');
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new ApiError(503, 'Razorpay secret not configured');
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  if (order.razorpayOrderId !== razorpay_order_id) {
    throw new ApiError(400, 'Order ID mismatch');
  }
  if (order.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not your order');
  }
  if (order.paymentStatus === 'paid') {
    return res.status(200).json(new ApiResponse(200, order, 'Already paid'));
  }

  const expectedBuffer = Buffer.from(expected, 'hex');
  const signatureBuffer = Buffer.from(razorpay_signature, 'hex');

  if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
    // Signature failed — release the reserved stock and mark order failed
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
    order.paymentStatus = 'failed';
    order.status = 'cancelled';
    await order.save();
    throw new ApiError(400, 'Payment verification failed');
  }

  // Stock was already decremented in createCheckout — just confirm the order
  order.paymentStatus = 'paid';
  order.status = 'confirmed';
  order.razorpayPaymentId = razorpay_payment_id;
  order.razorpayOrderId = razorpay_order_id;
  await order.save();

  if (order.coupon) {
    await Coupon.findByIdAndUpdate(order.coupon, { $inc: { usageCount: 1 } });
  }

  // Increment soldCount
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { soldCount: item.quantity } });
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }

  return res.status(200).json(new ApiResponse(200, order, 'Payment successful'));
});
