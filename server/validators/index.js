import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/* Auth Schemas                                                               */
/* -------------------------------------------------------------------------- */
export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(50),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  brandName: z.string().optional(),
  role: z.enum(['user', 'seller', 'admin']).optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

/* -------------------------------------------------------------------------- */
/* Category & Subcategory Schemas                                             */
/* -------------------------------------------------------------------------- */
export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
  description: z.string().trim().optional(),
  image: z.string().url('Must be a valid URL').optional().or(z.literal(''))
});

export const updateCategorySchema = createCategorySchema.partial();

/* -------------------------------------------------------------------------- */
/* User & Profile Schemas                                                     */
/* -------------------------------------------------------------------------- */
export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  phone: z.string().optional(),
  brandName: z.string().optional(),
  isActive: z.boolean().optional(),
  role: z.enum(['user', 'admin', 'seller']).optional()
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  phone: z.string().trim().min(1, 'Phone is required'),
  street: z.string().trim().min(1, 'Street is required'),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State is required'),
  zipCode: z.string().trim().min(1, 'Zip code is required'),
  country: z.string().trim().default('India'),
  isDefault: z.boolean().optional()
});

/* -------------------------------------------------------------------------- */
/* Product Schemas                                                            */
/* -------------------------------------------------------------------------- */
export const productBodySchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(5000),
  price: z.coerce.number().nonnegative(),
  discountedPrice: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce.number().nonnegative().optional()
  ),
  category: z.string().min(1, 'category is required'),
  subcategory: z.string().min(1, 'subcategory is required'),
  stock: z.coerce.number().int().nonnegative().default(10),
  gender: z.enum(['men', 'unisex']).optional(),
  badge: z.enum(['', 'new-arrival', 'sale', 'street-drip']).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  reviewCount: z.coerce.number().int().nonnegative().optional(),
  variantsMeta: z.string().optional(),
  existingImages: z.string().optional(),
  colors: z.string().optional()
});

export const productIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product id')
});

/* -------------------------------------------------------------------------- */
/* Order Schemas                                                              */
/* -------------------------------------------------------------------------- */
export const createOrderSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().trim().min(1, 'Full name is required'),
    phone: z.string().trim().min(1, 'Phone is required'),
    street: z.string().trim().min(1, 'Street is required'),
    city: z.string().trim().min(1, 'City is required'),
    state: z.string().trim().min(1, 'State is required'),
    zipCode: z.string().trim().min(1, 'Zip code is required'),
    country: z.string().trim().default('India')
  }),
  paymentMethod: z.enum(['razorpay', 'cod', 'demo']).default('cod'),
  couponCode: z.string().optional()
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['confirmed', 'shipped', 'delivered', 'cancelled'])
});

/* -------------------------------------------------------------------------- */
/* Coupon Schemas                                                             */
/* -------------------------------------------------------------------------- */
export const createCouponSchema = z.object({
  code: z.string().trim().min(3).max(20).toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  minPurchaseAmount: z.number().nonnegative().default(0),
  maxDiscountAmount: z.number().nonnegative().optional().nullable(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  usageLimit: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true)
});

export const updateCouponSchema = createCouponSchema.partial();
