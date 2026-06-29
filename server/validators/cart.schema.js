import { z } from 'zod';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const addToCartSchema = {
  body: z.object({
    productId: mongoId,
    variantId: mongoId.optional(),
    quantity: z.number().int().positive().optional().default(1),
    size: z.string().optional(),
    color: z.string().optional(),
  })
};

export const updateCartQuantitySchema = {
  body: z.object({
    itemId: mongoId,
    quantity: z.number().int().positive(),
  })
};

export const cartItemIdParamSchema = {
  params: z.object({
    itemId: mongoId,
  })
};
