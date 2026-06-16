import { Coupon } from '../models/coupon.model.js';
import { Order } from '../models/order.model.js';
import { Cart } from '../models/cart.model.js';

/* -------------------------------------------------------------------------- */
/*                                CORE CLASSES                                */
/* -------------------------------------------------------------------------- */

export class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = [], stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

/** Wraps async Express handlers so thrown errors reach error.middleware.js */
export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

/* -------------------------------------------------------------------------- */
/*                              STRING & PHONE                                */
/* -------------------------------------------------------------------------- */

export const slugify = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export function normalizeIndianPhone(input) {
  let digits = String(input ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

export function validateIndianPhone(input) {
  const digits = normalizeIndianPhone(input);
  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new Error('Enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
  }
  return digits;
}

/* -------------------------------------------------------------------------- */
/*                                  IMAGES                                    */
/* -------------------------------------------------------------------------- */

const PLACEHOLDER = '/assets/hero_casual.png';

export function normalizeImageUrl(image) {
  if (!image || typeof image !== 'string') return PLACEHOLDER;
  const trimmed = image.trim();
  if (!trimmed) return PLACEHOLDER;
  if (trimmed.startsWith('http') || trimmed.startsWith('/') || trimmed.startsWith('.')) {
    return trimmed;
  }
  if (trimmed.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i)) {
    return `/assets/${trimmed}`;
  }
  return PLACEHOLDER;
}

export function mapProductForResponse(product) {
  if (!product) return product;
  const obj = product.toObject ? product.toObject() : { ...product };
  obj.image = normalizeImageUrl(obj.image);
  if (obj.images && Array.isArray(obj.images)) {
    obj.images = obj.images.map(img => normalizeImageUrl(img));
  }
  if (obj.variants && Array.isArray(obj.variants)) {
    obj.variants = obj.variants.map(v => ({
      ...v,
      images: Array.isArray(v.images) ? v.images.map(img => normalizeImageUrl(img)) : []
    }));
  }
  return obj;
}

/* -------------------------------------------------------------------------- */
/*                                CART & ORDER                                */
/* -------------------------------------------------------------------------- */

export const getUnitPrice = (product) =>
  (product.discountedPrice !== undefined && product.discountedPrice !== null)
    ? Number(product.discountedPrice)
    : Number(product.price);

export const computeCartSubtotal = (items = []) => {
  let subtotal = 0;
  for (const item of items) {
    if (!item.product) continue;
    const unitPrice = getUnitPrice(item.product);
    subtotal += unitPrice * item.quantity;
  }
  return subtotal;
};

export const calculateCouponDiscount = async (code, cartTotal, cartItems = [], userId = null) => {
  const uppercaseCode = code.trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: uppercaseCode });

  if (!coupon) throw new ApiError(404, `Coupon code '${uppercaseCode}' is invalid.`);
  if (!coupon.isActive) throw new ApiError(400, `Coupon code '${uppercaseCode}' is inactive.`);
  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
    throw new ApiError(400, `Coupon code '${uppercaseCode}' has expired.`);
  }
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    throw new ApiError(400, `Coupon code '${uppercaseCode}' has reached limit.`);
  }

  if (userId && coupon.perUserLimit !== null) {
    const userCouponUsage = await Order.countDocuments({
      user: userId,
      coupon: coupon._id,
      status: { $ne: 'cancelled' }
    });
    if (userCouponUsage >= coupon.perUserLimit) {
      throw new ApiError(400, `You have already used this coupon.`);
    }
  }

  const cartTotalNum = Number(cartTotal);
  if (cartTotalNum < coupon.minCartAmount) {
    throw new ApiError(400, `Minimum purchase of ₹${coupon.minCartAmount} required.`);
  }

  let discountAmount = 0;
  let applicableTotal = cartTotalNum;
  let applicableItems = cartItems;

  // If coupon is vendor-specific, filter out products not owned by this vendor
  if (coupon.seller) {
    applicableItems = applicableItems.filter(item => {
      const prodSeller = item.product?.seller || item.product;
      // Depending on whether product is populated or not
      return prodSeller && prodSeller.toString() === coupon.seller.toString();
    });

    if (applicableItems.length === 0) {
      throw new ApiError(400, "Coupon not applicable to items in your cart.");
    }
    applicableTotal = applicableItems.reduce((sum, item) => sum + (getUnitPrice(item.product) || item.unitPrice || item.price) * item.quantity, 0);
    
    if (applicableTotal < coupon.minCartAmount) {
      throw new ApiError(400, `Minimum purchase of ₹${coupon.minCartAmount} required for this vendor's items.`);
    }
  }

  if (coupon.appliedProducts && coupon.appliedProducts.length > 0 && applicableItems.length > 0) {
    applicableItems = applicableItems.filter(item => 
      coupon.appliedProducts.some(prodId => prodId.toString() === (item.product?._id || item.product).toString())
    );
    if (applicableItems.length === 0) {
      throw new ApiError(400, `Not applicable to these specific products.`);
    }
    applicableTotal = applicableItems.reduce((sum, item) => sum + (getUnitPrice(item.product) || item.unitPrice || item.price) * item.quantity, 0);
  }

  if (coupon.discountType === 'percentage') {
    discountAmount = applicableTotal * (coupon.discountValue / 100);
  } else {
    discountAmount = coupon.discountValue;
  }

  discountAmount = Math.min(discountAmount, cartTotalNum);
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    finalTotal: cartTotalNum - discountAmount
  };
};

export const validateShippingAddress = (address) => {
  const required = ['fullName', 'phone', 'street', 'city', 'state', 'zipCode'];
  for (const field of required) {
    if (!address?.[field]?.trim()) {
      throw new ApiError(400, `${field} is required`);
    }
  }
  address.phone = validateIndianPhone(address.phone);
};

export const buildOrderFromCart = async (userId, { shippingAddress, couponCode }) => {
  validateShippingAddress(shippingAddress);
  const cart = await Cart.findOne({ user: userId }).populate('items.product');

  if (!cart || cart.items.length === 0) throw new ApiError(400, 'Cart is empty.');
  const validItems = cart.items.filter(item => item.product);

  for (const item of validItems) {
    if (item.product.stock < item.quantity) {
      throw new ApiError(400, `Only ${item.product.stock} left for "${item.product.title}".`);
    }
  }

  const subtotal = computeCartSubtotal(validItems);
  let discountAmount = 0;
  let taxableValue = subtotal;
  let appliedCouponCode;

  if (couponCode?.trim()) {
    const couponResult = await calculateCouponDiscount(couponCode, subtotal, validItems, userId);
    discountAmount = couponResult.discountAmount;
    taxableValue = couponResult.finalTotal;
    appliedCouponCode = couponResult.code;
  }

  const taxAmount = taxableValue * 0.18;
  const total = taxableValue + taxAmount;

  const orderItems = validItems.map(item => {
    const unitPrice = getUnitPrice(item.product);
    return {
      product: item.product._id,
      title: item.product.title,
      image: item.product.image,
      price: item.product.price,
      discountedPrice: item.product.discountedPrice,
      quantity: item.quantity,
      unitPrice,
      subtotal: unitPrice * item.quantity,
      size: item.size || '',
      color: item.color || ''
    };
  });

  return {
    cart,
    orderItems,
    subtotal,
    taxAmount,
    discountAmount,
    total,
    appliedCouponCode,
    shippingAddress
  };
};

export const generateOrderNumber = () => `BL-${Date.now().toString(36).toUpperCase()}`;
