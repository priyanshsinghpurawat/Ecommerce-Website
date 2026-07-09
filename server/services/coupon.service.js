import { Coupon } from '../models/coupon.model.js';
import { Order } from '../models/order.model.js';
import { ApiError, getUnitPrice } from '../utils/helpers.js';

export const calculateCouponDiscount = async (
  code,
  cartTotal,
  cartItems = [],
  userId = null,
  session = null,
) => {
  const uppercaseCode = code.trim().toUpperCase();
  let couponQuery = Coupon.findOne({ code: uppercaseCode });
  if (session) couponQuery = couponQuery.session(session);
  const coupon = await couponQuery;

  if (!coupon) throw new ApiError(404, `Coupon code '${uppercaseCode}' is invalid.`);
  if (!coupon.isActive) throw new ApiError(400, `Coupon code '${uppercaseCode}' is inactive.`);
  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
    throw new ApiError(400, `Coupon code '${uppercaseCode}' has expired.`);
  }
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    throw new ApiError(400, `Coupon code '${uppercaseCode}' has reached limit.`);
  }

  if (userId && coupon.perUserLimit !== null) {
    let usageQuery = Order.countDocuments({
      user: userId,
      coupon: coupon._id,
      status: { $ne: 'cancelled' },
    });
    if (session) usageQuery = usageQuery.session(session);
    const userCouponUsage = await usageQuery;
    if (userCouponUsage >= coupon.perUserLimit) {
      throw new ApiError(400, `You have already used this coupon.`);
    }
  }

  if (userId && coupon.newUsersOnly) {
    let orderCountQuery = Order.countDocuments({
      user: userId,
      status: { $ne: 'cancelled' },
    });
    if (session) orderCountQuery = orderCountQuery.session(session);
    const userOrderCount = await orderCountQuery;
    if (userOrderCount > 0) {
      throw new ApiError(400, `This coupon is only valid for your first order.`);
    }
  }

  const cartTotalNum = Number(cartTotal);
  if (cartTotalNum < coupon.minCartAmount) {
    throw new ApiError(400, `Minimum purchase of ₹${coupon.minCartAmount} required.`);
  }

  let discountAmount;
  let applicableTotal = cartTotalNum;
  let applicableItems = cartItems;

  if (coupon.seller) {
    applicableItems = applicableItems.filter((item) => {
      const prodSeller = item.product?.seller || item.product;
      return prodSeller && prodSeller.toString() === coupon.seller.toString();
    });

    if (applicableItems.length === 0) {
      throw new ApiError(400, 'Coupon not applicable to items in your cart.');
    }
    applicableTotal = applicableItems.reduce(
      (sum, item) =>
        sum + (getUnitPrice(item.product) || item.unitPrice || item.price) * item.quantity,
      0,
    );

    if (applicableTotal < coupon.minCartAmount) {
      throw new ApiError(
        400,
        `Minimum purchase of ₹${coupon.minCartAmount} required for this seller's items.`,
      );
    }
  }

  if (coupon.appliedProducts && coupon.appliedProducts.length > 0 && applicableItems.length > 0) {
    applicableItems = applicableItems.filter((item) =>
      coupon.appliedProducts.some(
        (prodId) => prodId.toString() === (item.product?._id || item.product).toString(),
      ),
    );
    if (applicableItems.length === 0) {
      throw new ApiError(400, `Not applicable to these specific products.`);
    }
    applicableTotal = applicableItems.reduce(
      (sum, item) =>
        sum + (getUnitPrice(item.product) || item.unitPrice || item.price) * item.quantity,
      0,
    );
  }

  if (coupon.discountType === 'percentage') {
    discountAmount = applicableTotal * (coupon.discountValue / 100);
  } else {
    discountAmount = coupon.discountValue;
  }

  discountAmount = Math.min(discountAmount, applicableTotal);
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    finalTotal: cartTotalNum - discountAmount,
  };
};
