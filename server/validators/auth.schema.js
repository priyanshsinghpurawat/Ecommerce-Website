import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(50),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/, 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
  phone: z.string().trim().optional().refine(
    (val) => !val || /^[6-9]\d{9}$/.test(
      (() => {
        let d = String(val).replace(/\D/g, '');
        if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
        if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
        return d;
      })()
    ),
    { message: 'Invalid phone number' }
  ),
  brandName: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, 'Google token is required')
});
