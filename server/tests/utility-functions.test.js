import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { getUnitPrice, computeCartSubtotal, calculateCouponDiscount, slugify } from '../utils/helpers.js';
import { Coupon } from '../models/coupon.model.js';
import { Order } from '../models/order.model.js';

/**
 * MASTER UTILITY FUNCTIONS TEST SUITE
 * 
 * This file contains unit tests for pure helper functions used across the backend.
 * These functions do NOT require a database connection as we use 'mocks' to
 * simulate database behavior.
 * 
 * Coverage:
 * 1. Cart Totals (Price calculation, subtotals)
 * 2. Coupon Calculations (Flat vs Percentage, Min-Spend rules)
 * 3. String Manipulation (Slugify)
 */

describe('1. Slugification Logic', () => {
  it('should convert text to lowercase and replace spaces with hyphens', () => {
    assert.strictEqual(slugify('Mens T-Shirt'), 'mens-t-shirt');
  });

  it('should remove special characters and symbols', () => {
    assert.strictEqual(slugify('Winter @ Collection! 2026'), 'winter-collection-2026');
  });

  it('should handle leading/trailing spaces and multiple hyphens', () => {
    assert.strictEqual(slugify('  Heavy   Denim   '), 'heavy-denim');
  });

  it('should return an empty string for null/undefined input', () => {
    assert.strictEqual(slugify(null), '');
    assert.strictEqual(slugify(undefined), '');
  });
});

describe('2. Cart Totals Calculation Logic', () => {
  it('should use the discounted price if it is set', () => {
    const product = { price: 1000, discountedPrice: 800 };
    assert.strictEqual(getUnitPrice(product), 800, 'Should return 800 (discounted)');
  });

  it('should fall back to original price if no discount exists', () => {
    const product = { price: 1000, discountedPrice: null };
    assert.strictEqual(getUnitPrice(product), 1000, 'Should return 1000 (original)');
  });

  it('should correctly sum up the total for multiple items in a cart', () => {
    const items = [
      { product: { price: 100, discountedPrice: 80 }, quantity: 2 }, // 160
      { product: { price: 200 }, quantity: 1 }                       // 200
    ];
    // Total should be 160 + 200 = 360
    assert.strictEqual(computeCartSubtotal(items), 360);
  });

  it('should handle broken data gracefully (e.g. null products)', () => {
    const items = [{ product: null, quantity: 1 }];
    assert.strictEqual(computeCartSubtotal(items), 0, 'Should return 0 for invalid products');
  });
});

describe('2. Coupon Discount Logic', () => {
  it('should throw a 404 error if the coupon code is not found in the database', async () => {
    // We 'mock' the Coupon.findOne method to return null (not found)
    const findOneMock = mock.method(Coupon, 'findOne', () => Promise.resolve(null));
    
    await assert.rejects(calculateCouponDiscount('INVALID_CODE', 1000), {
      statusCode: 404,
      message: "Coupon code 'INVALID_CODE' is invalid."
    });
    
    findOneMock.mock.restore();
  });

  it('should correctly apply a FLAT discount (e.g. ₹100 off)', async () => {
    const findOneMock = mock.method(Coupon, 'findOne', () => Promise.resolve({
      code: 'SAVE100',
      isActive: true,
      discountType: 'flat',
      discountValue: 100,
      minCartAmount: 500
    }));

    const result = await calculateCouponDiscount('SAVE100', 1000);
    assert.strictEqual(result.discountAmount, 100);
    assert.strictEqual(result.finalTotal, 900);
    
    findOneMock.mock.restore();
  });

  it('should correctly apply a PERCENTAGE discount (e.g. 10% off)', async () => {
    const findOneMock = mock.method(Coupon, 'findOne', () => Promise.resolve({
      code: 'OFF10',
      isActive: true,
      discountType: 'percentage',
      discountValue: 10,
      minCartAmount: 0
    }));

    const result = await calculateCouponDiscount('OFF10', 1000);
    assert.strictEqual(result.discountAmount, 100, '10% of 1000 is 100');
    assert.strictEqual(result.finalTotal, 900);
    
    findOneMock.mock.restore();
  });

  it('should reject a coupon if the cart total is below the minimum required amount', async () => {
    const findOneMock = mock.method(Coupon, 'findOne', () => Promise.resolve({
      code: 'BIGSPEND',
      isActive: true,
      discountType: 'flat',
      discountValue: 100,
      minCartAmount: 5000 // Requires 5000+
    }));

    await assert.rejects(
      calculateCouponDiscount('BIGSPEND', 1000), 
      /minimum purchase/i,
      'Should fail because 1000 < 5000'
    );
    
    findOneMock.mock.restore();
  });

  it('should accept a new-user-only coupon if the user has no previous orders', async () => {
    const findOneMock = mock.method(Coupon, 'findOne', () => Promise.resolve({
      code: 'NEWUSER10',
      isActive: true,
      discountType: 'percentage',
      discountValue: 10,
      minCartAmount: 0,
      newUsersOnly: true
    }));
    const countDocumentsMock = mock.method(Order, 'countDocuments', () => Promise.resolve(0));

    const result = await calculateCouponDiscount('NEWUSER10', 1000, [], 'user_id_123');
    assert.strictEqual(result.discountAmount, 100);
    assert.strictEqual(result.finalTotal, 900);

    findOneMock.mock.restore();
    countDocumentsMock.mock.restore();
  });

  it('should reject a new-user-only coupon if the user has existing orders', async () => {
    const findOneMock = mock.method(Coupon, 'findOne', () => Promise.resolve({
      code: 'NEWUSER10',
      isActive: true,
      discountType: 'percentage',
      discountValue: 10,
      minCartAmount: 0,
      newUsersOnly: true
    }));
    const countDocumentsMock = mock.method(Order, 'countDocuments', () => Promise.resolve(1));

    await assert.rejects(
      calculateCouponDiscount('NEWUSER10', 1000, [], 'user_id_123'),
      /only valid for your first order/i,
      'Should reject because user has 1 order'
    );

    findOneMock.mock.restore();
    countDocumentsMock.mock.restore();
  });
});
