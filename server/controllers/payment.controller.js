import crypto from 'crypto';
import Razorpay from 'razorpay';
import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { Variant } from '../models/variant.model.js';
import { Cart } from '../models/cart.model.js';
import { Coupon } from '../models/coupon.model.js';
import { User } from '../models/user.model.js';
import { asyncHandler, ApiError, ApiResponse, generateOrderNumber, calculateCouponDiscount, validateShippingAddress } from '../utils/helpers.js';
import logger from '../config/logger.js';
import { calculateOrderTotals, fetchAndValidateUserCart } from './order.controller.js';
import { restoreStock, incrementProductSales as incrementSalesBulk } from '../services/order.service.js';
import { ENV } from '../config/env.js';

const isRazorpayConfigured = () => {
  const keyId = ENV.RAZORPAY_KEY_ID;
  const keySecret = ENV.RAZORPAY_KEY_SECRET;
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
        keyId: enabled ? ENV.RAZORPAY_KEY_ID : null
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
    key_id: ENV.RAZORPAY_KEY_ID,
    key_secret: ENV.RAZORPAY_KEY_SECRET
  });
};

export const createCheckout = asyncHandler(async (req, res) => {
  const { shippingAddress, couponCode } = req.body;

  validateShippingAddress(shippingAddress);
  const cart = await fetchAndValidateUserCart(req.user._id);
  const calculations = await calculateOrderTotals(cart, couponCode, req.user._id);

  // Transactionally reserve stock up-front to prevent overselling
  const session = await mongoose.startSession();
  session.startTransaction();
  let committed = false;

  try {
    // Acquire lock on user to prevent checkout race conditions (Bug #7)
    await User.findByIdAndUpdate(req.user._id, { $set: { updatedAt: new Date() } }, { session });

    if (calculations.appliedCouponCode) {
      const validItems = cart.items.filter(item => item.product);
      await calculateCouponDiscount(calculations.appliedCouponCode, calculations.subtotal, validItems, req.user._id, session);
    }

    let appliedCouponId = null;
    if (calculations.appliedCouponCode) {
      const couponDoc = await Coupon.findOne({ code: calculations.appliedCouponCode }).session(session);
      if (couponDoc) {
        appliedCouponId = couponDoc._id;
      }
    }

    const sortedOrderItems = [...calculations.orderItems].sort((a, b) => 
      a.product.toString().localeCompare(b.product.toString())
    );

    for (const item of sortedOrderItems) {
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

      let updated;
      if (variant) {
        updated = await Variant.findOneAndUpdate(
          { _id: variant._id, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );
      } else {
        updated = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );
      }

      if (!updated) {
        throw new ApiError(400, `Insufficient stock for "${item.title}". It may have just sold out.`);
      }
    }

    const [order] = await Order.create([{
      orderNumber: generateOrderNumber(),
      user: req.user._id,
      items: calculations.orderItems,
      subtotal: calculations.subtotal,
      taxAmount: calculations.taxAmount,
      discountAmount: calculations.discountAmount,
      total: calculations.total,
      coupon: appliedCouponId,
      couponCode: calculations.appliedCouponCode,
      shippingAddress,
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      status: 'pending'
    }], { session });

    await session.commitTransaction();
    committed = true;
    session.endSession();

    const razorpay = getRazorpay();
    const amountPaise = Math.round(calculations.total * 100);
    let rzOrder;
    try {
      rzOrder = await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: order._id.toString(),
        notes: { orderNumber: order.orderNumber }
      });
      order.razorpayOrderId = rzOrder.id;
      await order.save();
    } catch {
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      await order.save();
      try {
        await restoreStock(order.items);
      } catch (restoreError) {
        logger.error('Failed to restore stock after Razorpay failure', { error: restoreError.message, orderId: order._id });
      }
      throw new ApiError(502, 'Payment gateway error. Please try again.');
    }

    return res.status(201).json(
      new ApiResponse(201, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: calculations.total,
        amountPaise,
        razorpayOrderId: rzOrder.id,
        keyId: ENV.RAZORPAY_KEY_ID
      }, 'Checkout ready')
    );
  } catch (error) {
    if (!committed) {
      await session.abortTransaction();
    }
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

  const secret = ENV.RAZORPAY_KEY_SECRET;
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
  if (order.paymentStatus !== 'pending') {
    return res.status(200).json(new ApiResponse(200, order, 'Order already processed'));
  }

  const expectedBuffer = Buffer.from(expected, 'hex');
  const signatureBuffer = Buffer.from(razorpay_signature, 'hex');

  if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Find and update the order inside the transaction
      const failedOrder = await Order.findOneAndUpdate(
        { _id: orderId, paymentStatus: 'pending' },
        { $set: { paymentStatus: 'failed', status: 'cancelled' } },
        { new: true, session }
      );

      if (!failedOrder) {
        throw new ApiError(400, 'Payment verification failed, but order was already processed.');
      }

      // Restore stock via the shared service
      await restoreStock(failedOrder.items, session);

      await session.commitTransaction();
    } catch (restoreErr) {
      await session.abortTransaction();
      throw restoreErr;
    } finally {
      session.endSession();
    }
    throw new ApiError(400, 'Payment verification failed');
  }

  // Atomically claim the order, then run post-success writes in a transaction
  const successOrder = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: 'pending' },
    {
      $set: {
        paymentStatus: 'paid',
        status: 'confirmed',
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id
      }
    },
    { new: true }
  );

  if (!successOrder) {
    return res.status(200).json(new ApiResponse(200, order, 'Order already processed successfully'));
  }

  // Run coupon increment + soldCount + cart clear inside a transaction so a
  // mid-flight crash cannot leave these in a partial / inconsistent state.
  const successSession = await mongoose.startSession();
  successSession.startTransaction();
  try {
    if (successOrder.coupon) {
      await Coupon.findByIdAndUpdate(
        successOrder.coupon,
        { $inc: { usageCount: 1 } },
        { session: successSession }
      );
    }

    // Bulk-increment soldCount (same pattern as order.service.js)
    await incrementSalesBulk(successOrder.items, successSession);

    const cart = await Cart.findOne({ user: req.user._id }).session(successSession);
    if (cart) {
      cart.items = [];
      await cart.save({ session: successSession });
    }

    await successSession.commitTransaction();
  } catch (postErr) {
    await successSession.abortTransaction();
    // Payment is already confirmed — log and continue rather than failing the response
    logger.error('[Payment] Post-success writes failed (non-fatal):', postErr.message);
  } finally {
    successSession.endSession();
  }

  return res.status(200).json(new ApiResponse(200, successOrder, 'Payment successful'));
});
