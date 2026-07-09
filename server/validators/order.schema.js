import { z } from 'zod';

export const createOrderSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().trim().min(1, 'Full name is required'),
    phone: z
      .string()
      .trim()
      .min(1, 'Phone is required')
      .transform((val) => {
        let d = String(val).replace(/\D/g, '');
        if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
        if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
        return d;
      })
      .refine((val) => /^[6-9]\d{9}$/.test(val), { message: 'Invalid phone number' }),
    street: z.string().trim().min(1, 'Street is required'),
    city: z.string().trim().min(1, 'City is required'),
    state: z.string().trim().min(1, 'State is required'),
    zipCode: z
      .string()
      .trim()
      .min(1, 'Zip code is required')
      .regex(/^\d{6}$/, 'PIN code must be 6 digits'),
    country: z.string().trim().default('India'),
  }),
  paymentMethod: z.enum(['razorpay', 'cod', 'demo']).default('cod'),
  couponCode: z.string().optional(),
  attributionTag: z.string().trim().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['confirmed', 'partially_shipped', 'shipped', 'delivered', 'cancelled']),
  itemId: z.string().optional(),
  trackingNumber: z.string().optional(),
});
