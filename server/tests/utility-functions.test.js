import { describe, it, expect, vi } from 'vitest';
import { getUnitPrice, computeCartSubtotal, calculateCouponDiscount, slugify } from '../utils/helpers.js';
import { Coupon } from '../models/coupon.model.js';
import { Order } from '../models/order.model.js';

/**
 * MASTER UTILITY FUNCTIONS TEST SUITE (VITEST)
 * 
 * Coverage:
 * 1. String Manipulation (Slugify + weird characters)
 * 2. Cart Totals (Price calculation, subtotal logic + bad data)
 * 3. Coupon Calculations (Types, minimums, constraints, and limits)
 */

describe('1. Slugification Logic', () => {
  it('should convert text to lowercase and replace spaces with hyphens', () => {
    expect(slugify('Mens T-Shirt')).toBe('mens-t-shirt');
  });

  it('should remove special characters and symbols', () => {
    expect(slugify('Winter @ Collection! 2026')).toBe('winter-collection-2026');
  });

  it('should handle leading/trailing spaces and multiple hyphens', () => {
    expect(slugify('  Heavy   Denim   ')).toBe('heavy-denim');
  });

  it('should return an empty string for null/undefined input', () => {
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
  });

  // Edge Case: Weird symbols and emojis
  it('should handle strings with emojis and weird unicode correctly', () => {
    expect(slugify('Fire 🔥 Sneakers & Stuff')).toBe('fire-sneakers-stuff');
    expect(slugify('   ---    ')).toBe('-');
  });
});

describe('2. Cart Totals Calculation Logic', () => {
  it('should use the discounted price if it is set', () => {
    const product = { price: 1000, discountedPrice: 800 };
    expect(getUnitPrice(product)).toBe(800);
  });

  it('should fall back to original price if no discount exists', () => {
    const product = { price: 1000, discountedPrice: null };
    expect(getUnitPrice(product)).toBe(1000);
  });

  // Edge Case: Zero or negative prices
  it('should safely handle 0 price', () => {
    const product = { price: 0 };
    expect(getUnitPrice(product)).toBe(0);
  });

  it('should correctly sum up the total for multiple items in a cart', () => {
    const items = [
      { product: { price: 100, discountedPrice: 80 }, quantity: 2 }, // 160
      { product: { price: 200 }, quantity: 1 }                       // 200
    ];
    expect(computeCartSubtotal(items)).toBe(360);
  });

  it('should handle broken data gracefully (e.g. null products)', () => {
    const items = [{ product: null, quantity: 1 }];
    expect(computeCartSubtotal(items)).toBe(0);
  });

  // Edge Case: Missing quantities or empty arrays
  it('should assume 0 quantity if not provided or handle empty carts', () => {
    const items1 = [{ product: { price: 100 } }]; // Missing quantity
    const items2 = []; // Empty cart
    expect(computeCartSubtotal(items1)).toBeNaN(); 
    expect(computeCartSubtotal(items2)).toBe(0);
  });
});

describe('3. Coupon Discount Logic', () => {
  it('should throw a 404 error if the coupon code is not found in the database', async () => {
    const findOneMock = vi.spyOn(Coupon, 'findOne').mockResolvedValue(null);
    
    await expect(calculateCouponDiscount('INVALID_CODE', 1000))
      .rejects.toThrow("Coupon code 'INVALID_CODE' is invalid.");
    
    findOneMock.mockRestore();
  });

  it('should correctly apply a FLAT discount (e.g. ₹100 off)', async () => {
    const findOneMock = vi.spyOn(Coupon, 'findOne').mockResolvedValue({
      code: 'SAVE100',
      isActive: true,
      discountType: 'flat',
      discountValue: 100,
      minCartAmount: 500
    });

    const result = await calculateCouponDiscount('SAVE100', 1000);
    expect(result.discountAmount).toBe(100);
    expect(result.finalTotal).toBe(900);
    
    findOneMock.mockRestore();
  });

  it('should correctly apply a PERCENTAGE discount (e.g. 10% off)', async () => {
    const findOneMock = vi.spyOn(Coupon, 'findOne').mockResolvedValue({
      code: 'OFF10',
      isActive: true,
      discountType: 'percentage',
      discountValue: 10,
      minCartAmount: 0
    });

    const result = await calculateCouponDiscount('OFF10', 1000);
    expect(result.discountAmount).toBe(100);
    expect(result.finalTotal).toBe(900);
    
    findOneMock.mockRestore();
  });

  it('should reject a coupon if the cart total is below the minimum required amount', async () => {
    const findOneMock = vi.spyOn(Coupon, 'findOne').mockResolvedValue({
      code: 'BIGSPEND',
      isActive: true,
      discountType: 'flat',
      discountValue: 100,
      minCartAmount: 5000 
    });

    await expect(calculateCouponDiscount('BIGSPEND', 1000))
      .rejects.toThrow(/minimum purchase/i);
    
    findOneMock.mockRestore();
  });

  it('should accept a new-user-only coupon if the user has no previous orders', async () => {
    const findOneMock = vi.spyOn(Coupon, 'findOne').mockResolvedValue({
      code: 'NEWUSER10',
      isActive: true,
      discountType: 'percentage',
      discountValue: 10,
      minCartAmount: 0,
      newUsersOnly: true
    });
    const countDocumentsMock = vi.spyOn(Order, 'countDocuments').mockResolvedValue(0);

    const result = await calculateCouponDiscount('NEWUSER10', 1000, [], 'user_id_123');
    expect(result.discountAmount).toBe(100);
    expect(result.finalTotal).toBe(900);

    findOneMock.mockRestore();
    countDocumentsMock.mockRestore();
  });

  it('should reject a new-user-only coupon if the user has existing orders', async () => {
    const findOneMock = vi.spyOn(Coupon, 'findOne').mockResolvedValue({
      code: 'NEWUSER10',
      isActive: true,
      discountType: 'percentage',
      discountValue: 10,
      minCartAmount: 0,
      newUsersOnly: true
    });
    const countDocumentsMock = vi.spyOn(Order, 'countDocuments').mockResolvedValue(1);

    await expect(calculateCouponDiscount('NEWUSER10', 1000, [], 'user_id_123'))
      .rejects.toThrow(/only valid for your first order/i);

    findOneMock.mockRestore();
    countDocumentsMock.mockRestore();
  });

  // Edge Case: Expiry Date
  it('should reject an expired coupon', async () => {
    const findOneMock = vi.spyOn(Coupon, 'findOne').mockResolvedValue({
      code: 'EXPIRED10',
      isActive: true,
      discountType: 'percentage',
      discountValue: 10,
      minCartAmount: 0,
      expiryDate: new Date('2020-01-01') // Past date
    });

    await expect(calculateCouponDiscount('EXPIRED10', 1000))
      .rejects.toThrow(/has expired/i);

    findOneMock.mockRestore();
  });

  // Edge Case: Usage Limit Exhausted
  it('should reject a coupon if it has reached its global usage limit', async () => {
    const findOneMock = vi.spyOn(Coupon, 'findOne').mockResolvedValue({
      code: 'LIMITED',
      isActive: true,
      discountType: 'flat',
      discountValue: 50,
      minCartAmount: 0,
      usageLimit: 10,
      usageCount: 10 // Used count equals usage limit
    });

    await expect(calculateCouponDiscount('LIMITED', 1000))
      .rejects.toThrow(/reached limit/i);

    findOneMock.mockRestore();
  });

  // Edge Case: Inactive Coupon
  it('should reject a coupon if it is marked as inactive', async () => {
    const findOneMock = vi.spyOn(Coupon, 'findOne').mockResolvedValue({
      code: 'INACTIVE',
      isActive: false, // Inactive
      discountType: 'flat',
      discountValue: 50,
      minCartAmount: 0
    });

    await expect(calculateCouponDiscount('INACTIVE', 1000))
      .rejects.toThrow(/is inactive/i);

    findOneMock.mockRestore();
  });
});
