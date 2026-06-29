import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema, googleLoginSchema } from '../../validators/auth.schema.js';
import { addToCartSchema, updateCartQuantitySchema } from '../../validators/cart.schema.js';
import { createCategorySchema } from '../../validators/category.schema.js';
import { createCouponSchema } from '../../validators/coupon.schema.js';
import { createOrderSchema, updateOrderStatusSchema } from '../../validators/order.schema.js';

describe('Auth Validators', () => {
  describe('registerSchema', () => {
    it('accepts valid registration data', () => {
      const data = { name: 'Test User', email: 'test@test.com', password: 'Pass@1234' };
      expect(() => registerSchema.parse(data)).not.toThrow();
    });

    it('rejects short name', () => {
      expect(() => registerSchema.parse({ name: 'T', email: 'a@b.com', password: 'Pass@1234' })).toThrow();
    });

    it('rejects invalid email', () => {
      expect(() => registerSchema.parse({ name: 'Test', email: 'not-email', password: 'Pass@1234' })).toThrow();
    });

    it('rejects weak password (no uppercase)', () => {
      expect(() => registerSchema.parse({ name: 'Test', email: 'a@b.com', password: 'pass@1234' })).toThrow();
    });

    it('rejects weak password (no special char)', () => {
      expect(() => registerSchema.parse({ name: 'Test', email: 'a@b.com', password: 'Pass12345' })).toThrow();
    });

    it('rejects short password', () => {
      expect(() => registerSchema.parse({ name: 'Test', email: 'a@b.com', password: 'P@1a' })).toThrow();
    });

    it('accepts optional phone', () => {
      const data = { name: 'Test', email: 't@t.com', password: 'Pass@1234', phone: '9876543210' };
      expect(() => registerSchema.parse(data)).not.toThrow();
    });

    it('normalizes email to lowercase', () => {
      const result = registerSchema.parse({ name: 'Test', email: 'TEST@TEST.COM', password: 'Pass@1234' });
      expect(result.email).toBe('test@test.com');
    });
  });

  describe('loginSchema', () => {
    it('accepts valid login', () => {
      expect(() => loginSchema.parse({ email: 'a@b.com', password: 'pass' })).not.toThrow();
    });

    it('rejects missing password', () => {
      expect(() => loginSchema.parse({ email: 'a@b.com' })).toThrow();
    });

    it('rejects invalid email', () => {
      expect(() => loginSchema.parse({ email: 'bad', password: 'pass' })).toThrow();
    });
  });

  describe('googleLoginSchema', () => {
    it('accepts valid token', () => {
      expect(() => googleLoginSchema.parse({ idToken: 'token123' })).not.toThrow();
    });

    it('rejects empty token', () => {
      expect(() => googleLoginSchema.parse({ idToken: '' })).toThrow();
    });
  });
});

describe('Cart Validators', () => {
  describe('addToCartSchema', () => {
    it('accepts valid addToCart body', () => {
      const result = addToCartSchema.body.parse({
        productId: '507f1f77bcf86cd799439011',
        quantity: 2,
        size: 'M',
        color: 'Red'
      });
      expect(result.productId).toBe('507f1f77bcf86cd799439011');
      expect(result.quantity).toBe(2);
    });

    it('defaults quantity to 1', () => {
      const result = addToCartSchema.body.parse({ productId: '507f1f77bcf86cd799439011' });
      expect(result.quantity).toBe(1);
    });

    it('rejects invalid productId format', () => {
      expect(() => addToCartSchema.body.parse({ productId: 'not-id' })).toThrow();
    });

    it('rejects non-positive quantity', () => {
      expect(() => addToCartSchema.body.parse({ productId: '507f1f77bcf86cd799439011', quantity: 0 })).toThrow();
    });

    it('accepts optional variantId', () => {
      const result = addToCartSchema.body.parse({
        productId: '507f1f77bcf86cd799439011',
        variantId: '507f1f77bcf86cd799439012'
      });
      expect(result.variantId).toBe('507f1f77bcf86cd799439012');
    });
  });

  describe('updateCartQuantitySchema', () => {
    it('accepts valid body', () => {
      const result = updateCartQuantitySchema.body.parse({
        itemId: '507f1f77bcf86cd799439011',
        quantity: 3
      });
      expect(result.quantity).toBe(3);
    });

    it('rejects zero quantity', () => {
      expect(() => updateCartQuantitySchema.body.parse({
        itemId: '507f1f77bcf86cd799439011',
        quantity: 0
      })).toThrow();
    });
  });
});

describe('Category Validators', () => {
  describe('createCategorySchema', () => {
    it('accepts valid category', () => {
      const result = createCategorySchema.parse({ name: 'Clothing' });
      expect(result.name).toBe('Clothing');
    });

    it('rejects empty name', () => {
      expect(() => createCategorySchema.parse({ name: '' })).toThrow();
    });
  });
});

describe('Coupon Validators', () => {
  describe('createCouponSchema', () => {
    it('accepts valid percentage coupon', () => {
      const result = createCouponSchema.parse({
        code: 'SAVE10',
        discountType: 'percentage',
        discountValue: 10
      });
      expect(result.code).toBe('SAVE10');
    });

    it('accepts valid flat coupon', () => {
      const result = createCouponSchema.parse({
        code: 'FLAT100',
        discountType: 'flat',
        discountValue: 100
      });
      expect(result.discountType).toBe('flat');
    });

    it('rejects negative discount', () => {
      expect(() => createCouponSchema.parse({
        code: 'BAD',
        discountType: 'percentage',
        discountValue: -5
      })).toThrow();
    });
  });
});

describe('Order Validators', () => {
  describe('createOrderSchema', () => {
    const validOrder = {
      shippingAddress: {
        fullName: 'Test User',
        phone: '9876543210',
        street: '123 Main St',
        city: 'Mumbai',
        state: 'MH',
        zipCode: '400001'
      }
    };

    it('accepts valid order', () => {
      expect(() => createOrderSchema.parse(validOrder)).not.toThrow();
    });

    it('normalizes phone number in shipping address', () => {
      const result = createOrderSchema.parse({
        ...validOrder,
        shippingAddress: { ...validOrder.shippingAddress, phone: '+919876543210' }
      });
      expect(result.shippingAddress.phone).toBe('9876543210');
    });

    it('rejects invalid phone', () => {
      expect(() => createOrderSchema.parse({
        ...validOrder,
        shippingAddress: { ...validOrder.shippingAddress, phone: '12345' }
      })).toThrow();
    });

    it('rejects invalid PIN code', () => {
      expect(() => createOrderSchema.parse({
        ...validOrder,
        shippingAddress: { ...validOrder.shippingAddress, zipCode: '12345' }
      })).toThrow();
    });

    it('defaults paymentMethod to cod', () => {
      const result = createOrderSchema.parse(validOrder);
      expect(result.paymentMethod).toBe('cod');
    });

    it('accepts optional couponCode', () => {
      const result = createOrderSchema.parse({ ...validOrder, couponCode: 'SAVE10' });
      expect(result.couponCode).toBe('SAVE10');
    });
  });

  describe('updateOrderStatusSchema', () => {
    it('accepts valid status', () => {
      const result = updateOrderStatusSchema.parse({ status: 'shipped' });
      expect(result.status).toBe('shipped');
    });

    it('rejects invalid status', () => {
      expect(() => updateOrderStatusSchema.parse({ status: 'invalid' })).toThrow();
    });

    it('accepts optional trackingNumber', () => {
      const result = updateOrderStatusSchema.parse({ status: 'shipped', trackingNumber: 'TRK123' });
      expect(result.trackingNumber).toBe('TRK123');
    });
  });
});
