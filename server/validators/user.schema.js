import { z } from 'zod';

const normalizePhone = (val) => {
  let d = String(val).replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d;
};

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  phone: z.string().trim().optional().refine(
    (val) => !val || /^[6-9]\d{9}$/.test(normalizePhone(val)),
    { message: 'Invalid phone number' }
  ),
  brandName: z.string().optional(),
  isActive: z.boolean().optional(),
  role: z.enum(['user', 'admin', 'seller']).optional()
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  phone: z.string().trim().min(1, 'Phone is required').transform(normalizePhone).refine(
    (val) => /^[6-9]\d{9}$/.test(val),
    { message: 'Invalid phone number' }
  ),
  street: z.string().trim().min(1, 'Street is required'),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State is required'),
  zipCode: z.string().trim().min(1, 'Zip code is required').regex(/^\d{6}$/, 'PIN code must be 6 digits'),
  country: z.string().trim().default('India'),
  isDefault: z.boolean().optional()
});
