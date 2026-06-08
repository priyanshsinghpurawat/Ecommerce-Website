import { Cart } from '../models/cart.model.js';
import { ApiError } from './apiError.js';
import { calculateCouponDiscount } from './couponCalc.js';
import { computeCartSubtotal, getUnitPrice } from './cartTotals.js';
import { validateIndianPhone } from './phone.js';

export const validateShippingAddress = (address) => {
  const required = ['fullName', 'phone', 'street', 'city', 'state', 'zipCode'];
  for (const field of required) {
    if (!address?.[field]?.trim()) {
      throw new ApiError(400, `${field} is required for shipping`);
    }
  }
  try {
    address.phone = validateIndianPhone(address.phone);
  } catch (err) {
    throw new ApiError(400, err.message);
  }
};

export const buildOrderFromCart = async (userId, { shippingAddress, couponCode }) => {
  validateShippingAddress(shippingAddress);

  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'title price discountedPrice image stock category subcategory'
  });

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Your cart is empty.');
  }

  const validItems = cart.items.filter((item) => item.product);
  if (validItems.length === 0) {
    throw new ApiError(400, 'Cart has invalid products.');
  }

  for (const item of validItems) {
    const product = item.product;
    if (product.stock < item.quantity) {
      throw new ApiError(
        400,
        `Only ${product.stock} left for "${product.title}".`
      );
    }
  }

  const subtotal = computeCartSubtotal(validItems);
  let discountAmount = 0;
  let total = subtotal;
  let appliedCouponCode;

  if (couponCode?.trim()) {
    const couponResult = await calculateCouponDiscount(couponCode, subtotal, validItems, userId);
    discountAmount = couponResult.discountAmount;
    total = couponResult.finalTotal;
    appliedCouponCode = couponResult.code;
  }

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
      subtotal: unitPrice * item.quantity
    };
  });

  return {
    cart,
    validItems,
    orderItems,
    subtotal,
    discountAmount,
    total,
    appliedCouponCode,
    shippingAddress: {
      fullName: shippingAddress.fullName.trim(),
      phone: shippingAddress.phone.trim(),
      street: shippingAddress.street.trim(),
      city: shippingAddress.city.trim(),
      state: shippingAddress.state.trim(),
      zipCode: shippingAddress.zipCode.trim(),
      country: shippingAddress.country?.trim() || 'India'
    }
  };
};

export const generateOrderNumber = () =>
  `BL-${Date.now().toString(36).toUpperCase()}`;
