import { z } from 'zod';

export const createCouponSchema = z.object({
  code: z.string().trim().min(3).max(20).toUpperCase(),
  discountType: z.enum(['percentage', 'flat']),
  discountValue: z.number().positive(),
  minCartAmount: z.number().nonnegative().default(0),
  expiryDate: z.preprocess(
    (val) => (val === '' ? null : val),
    z
      .string()
      .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid date format' })
      .optional()
      .nullable(),
  ),
  usageLimit: z.number().int().nonnegative().nullable().default(null),
  perUserLimit: z.number().int().nonnegative().nullable().default(1),
  appliedProducts: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  newUsersOnly: z.boolean().default(false).optional(),
});

export const updateCouponSchema = createCouponSchema.partial();
