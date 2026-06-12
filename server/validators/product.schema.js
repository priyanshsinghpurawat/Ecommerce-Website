import { z } from 'zod';

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
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product id')
});
