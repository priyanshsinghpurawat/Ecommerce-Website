import crypto from 'crypto';
import { Coupon } from '../models/coupon.model.js';
import { Order } from '../models/order.model.js';

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

// Subclasses of ApiError for specific domains
export class ValidationError extends ApiError {
  constructor(message = "Validation failed", errors = []) {
    super(400, message, errors);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(404, message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized request") {
    super(401, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Access forbidden") {
    super(403, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict detected") {
    super(409, message);
  }
}

export class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  static success(res, data, message = "Success", statusCode = 200) {
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
  }

  static created(res, data, message = "Resource created successfully") {
    return res.status(201).json(new ApiResponse(201, data, message));
  }

  static paginated(res, data, page, limit, total, message = "Success") {
    const pages = Math.ceil(total / limit);
    const payload = {
      items: data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages
      }
    };
    return res.status(200).json(new ApiResponse(200, payload, message));
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
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
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
  if (trimmed.includes('mens_shirt.png') || trimmed === 'mens_shirt.png') {
    return '/assets/menshirt.avif';
  }
  if (trimmed.startsWith('http') || trimmed.startsWith('/') || trimmed.startsWith('.')) {
    return trimmed;
  }
  if (trimmed.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i)) {
    return `/assets/${trimmed}`;
  }
  return PLACEHOLDER;
}

export function mapProductForResponse(product, _req = null) {
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

export const calculateCouponDiscount = async (code, cartTotal, cartItems = [], userId = null, session = null) => {
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
      status: { $ne: 'cancelled' }
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
      status: { $ne: 'cancelled' }
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

  // If coupon is seller-specific, filter out products not owned by this seller
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
      throw new ApiError(400, `Minimum purchase of ₹${coupon.minCartAmount} required for this seller's items.`);
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

  discountAmount = Math.min(discountAmount, applicableTotal);
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

export const generateOrderNumber = () =>
  `BL-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`.toUpperCase();

/** Safely JSON.parse a string field, returning fallback on error. */
export const safeJSON = (v, fallback) => {
  if (v == null || v === '') return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback; }
};

/**
 * Generate cache hash from object parameters
 * Deduplicates parameters and creates consistent cache keys
 */
export const getCacheHash = (params) => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      const value = String(params[key]).replace(/[\s:]{1,}/g, '');
      acc[key] = value;
      return acc;
    }, {});
  
  const hash = crypto.createHash('md5').update(JSON.stringify(sortedParams)).digest('hex');
  return hash;
};

/**
 * Extract safe user fields for API responses
 * Removes sensitive fields like password while maintaining all public user data
 */
export const buildSafeUser = (user) => {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    brandName: user.brandName,
    avatar: user.avatar,
    isActive: user.isActive,
    addresses: user.addresses,
    wishlist: user.wishlist,
    storefront: user.storefront
  };
};
