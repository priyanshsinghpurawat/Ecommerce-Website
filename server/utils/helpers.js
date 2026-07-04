import crypto from 'crypto';

/* -------------------------------------------------------------------------- */
/*                                CORE CLASSES                                */
/* -------------------------------------------------------------------------- */

export class ApiError extends Error {
  constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
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
  constructor(statusCode, data, message = 'Success') {
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
  if (!text) return '';
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
    obj.images = obj.images.map((img) => normalizeImageUrl(img));
  }
  if (obj.variants && Array.isArray(obj.variants)) {
    obj.variants = obj.variants.map((v) => ({
      ...v,
      images: Array.isArray(v.images) ? v.images.map((img) => normalizeImageUrl(img)) : [],
    }));
  }
  return obj;
}

/* -------------------------------------------------------------------------- */
/*                                CART & ORDER                                */
/* -------------------------------------------------------------------------- */

export const getUnitPrice = (product) =>
  product.discountedPrice !== undefined && product.discountedPrice !== null
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
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
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
    storefront: user.storefront,
  };
};
