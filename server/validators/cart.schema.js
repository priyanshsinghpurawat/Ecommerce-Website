import { z } from 'zod';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// Flat schemas matching what validate() expects: { body?: ZodSchema, params?: ZodSchema }
// Previously these were z.object({ body: z.object({...}) }) which caused validate() to
// receive schemas.body as a plain object instead of a Zod schema, silently bypassing validation.

export const addToCartSchema = {
  body: z.object({
    productId: mongoId,
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
