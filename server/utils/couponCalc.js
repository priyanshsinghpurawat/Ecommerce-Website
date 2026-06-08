import { Coupon } from '../models/coupon.model.js';
import { Order } from '../models/order.model.js';
import { ApiError } from './apiError.js';

export const calculateCouponDiscount = async (code, cartTotal, cartItems = [], userId = null) => {
  const uppercaseCode = code.trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: uppercaseCode });

  if (!coupon) {
    throw new ApiError(404, `Coupon code '${uppercaseCode}' is invalid.`);
  }

  if (!coupon.isActive) {
    throw new ApiError(400, `Coupon code '${uppercaseCode}' is inactive.`);
  }

  // 1. Expiry Check
  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
    throw new ApiError(400, `Coupon code '${uppercaseCode}' has expired.`);
  }

  // 2. Global Usage Limit Check
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    throw new ApiError(400, `Coupon code '${uppercaseCode}' has reached its maximum usage limit.`);
  }

  // 3. Per-User Limit Check (Requires userId)
  if (userId && coupon.perUserLimit !== null) {
    const userCouponUsage = await Order.countDocuments({
      user: userId,
      coupon: coupon._id,
      status: { $ne: 'cancelled' } // Don't count cancelled orders
    });

    if (userCouponUsage >= coupon.perUserLimit) {
      throw new ApiError(400, `You have already used this coupon the maximum number of times allowed.`);
    }
  }

  const cartTotalNum = Number(cartTotal);
  if (cartTotalNum < coupon.minCartAmount) {
    throw new ApiError(
      400,
      `Minimum purchase of ₹${coupon.minCartAmount.toFixed(2)} is required to apply this coupon. Your total is ₹${cartTotalNum.toFixed(2)}.`
    );
  }

  let discountAmount = 0;
  let applicableTotal = cartTotalNum;

  // Handle product-specific coupons
  if (coupon.appliedProducts && coupon.appliedProducts.length > 0) {
    if (!cartItems || cartItems.length === 0) {
      // If no cart items provided, we can't calculate product-specific discount accurately
      // but we can assume it's valid if we are just checking validity.
      // However, for real calculation, we need items.
    } else {
      const applicableItems = cartItems.filter(item => 
        coupon.appliedProducts.some(prodId => prodId.toString() === (item.product?._id || item.product).toString())
      );

      if (applicableItems.length === 0) {
        throw new ApiError(400, `This coupon is not applicable to any products in your cart.`);
      }

      applicableTotal = applicableItems.reduce((sum, item) => sum + (item.unitPrice || item.price) * item.quantity, 0);
    }
  }

  if (coupon.discountType === 'percentage') {
    discountAmount = applicableTotal * (coupon.discountValue / 100);
  } else {
    discountAmount = coupon.discountValue;
  }

  discountAmount = Math.min(discountAmount, cartTotalNum);
  const finalTotal = cartTotalNum - discountAmount;

  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    finalTotal,
    isProductSpecific: coupon.appliedProducts && coupon.appliedProducts.length > 0
  };
};
