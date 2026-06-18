import { z } from 'zod';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const addToCartSchema = z.object({
  body: z.object({
    productId: mongoId,
    quantity: z.number().int().positive().optional().default(1),
    size: z.string().optional(),
    color: z.string().optional(),
  })
});

export const updateCartQuantitySchema = z.object({
  body: z.object({
    itemId: mongoId,
    quantity: z.number().int().positive(),
  })
});

export const cartItemIdParamSchema = z.object({
  params: z.object({
    itemId: mongoId,
  })
});
