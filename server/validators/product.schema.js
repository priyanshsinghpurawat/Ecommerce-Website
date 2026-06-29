import { z } from 'zod';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const variantSchema = z.object({
  color: z.string().trim().optional(),
  size: z.string().trim().optional(),
  sku: z.string().trim().optional(),
  stock: z.coerce.number().int().nonnegative().default(0),
  price: z.coerce.number().nonnegative().nullable().optional(),
  images: z.array(z.string()).default([])
});

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
  gender: z.enum(['men', 'women', 'unisex']).optional(),
  badge: z.enum(['', 'new-arrival', 'sale', 'street-drip', 'limited-edition']).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  reviewCount: z.coerce.number().int().nonnegative().optional(),
  variants: z.array(variantSchema).default([]),
  existingImages: z.string().optional(),
  relatedProducts: z.union([z.string(), z.array(z.string())]).optional()
});

export const productIdParamSchema = z.object({
  id: z.string().min(1, 'Product identifier is required')
});

// Variant schemas
export const generateVariantsSchema = z.object({
  options: z.array(z.object({
    name: z.string().trim().min(1),
    values: z.array(z.string().trim().min(1)).min(1)
  })).min(1)
});

export const bulkUpsertVariantsSchema = z.object({
  variants: z.array(z.object({
    sku: z.string().trim().min(1),
    color: z.string().trim().optional(),
    size: z.string().trim().optional(),
    stock: z.coerce.number().int().nonnegative().default(0),
    price: z.coerce.number().nonnegative().nullable().optional(),
    compareAtPrice: z.coerce.number().nonnegative().nullable().optional(),
    images: z.array(z.string()).default([])
  })).min(1)
});

export const updateVariantStockSchema = z.object({
  stock: z.coerce.number().int().nonnegative()
});

export const bulkUpdateStockSchema = z.object({
  updates: z.array(z.object({
    variantId: mongoId,
    quantity: z.coerce.number().int()
  })).min(1)
});
