import { describe, it, expect } from 'vitest';
import {
  unwrapData,
  getErrorMessage,
  resolveImageUrl,
  getDiscountPercent,
  normalizeIndianPhone,
  validateIndianPhone
} from './helpers.js';

describe('1. API Data Unwrapping', () => {
  it('should extract the .data property if it exists', () => {
    const payload = { success: true, data: { user: 'Test' } };
    expect(unwrapData(payload)).toEqual({ user: 'Test' });
  });

  it('should return the raw payload if .data is missing or undefined', () => {
    const payload = { success: true, msg: 'Hello' };
    expect(unwrapData(payload)).toEqual(payload);
  });

  // Edge Case: Null and undefined
  it('should safely handle null or undefined payloads', () => {
    expect(unwrapData(null)).toBeNull();
    expect(unwrapData(undefined)).toBeNull();
  });
});

describe('2. Error Message Parsing', () => {
  it('should extract array-based error messages from Axios responses', () => {
    const err = { response: { data: { message: ['Too short', 'Invalid email'] } } };
    expect(getErrorMessage(err)).toBe('Too short, Invalid email');
  });

  it('should return network connection fallback if API is unreachable', () => {
    const err = { code: 'ERR_NETWORK' };
    expect(getErrorMessage(err)).toContain("Can't reach the shop API");
  });

  // Edge Case: Completely malformed error objects
  it('should return the custom fallback if the error object is garbage', () => {
    const err = { random: 'garbage' };
    expect(getErrorMessage(err, 'Custom Fallback')).toBe('Custom Fallback');
  });
});

describe('3. Image URL Resolution', () => {
  it('should fix unsplash URLs lacking http protocols', () => {
    const url = 'unsplash.com/photos/123';
    expect(resolveImageUrl(url)).toBe('https://unsplash.com/photos/123');
  });

  it('should apply Cloudinary quality/format optimizations automatically', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
    expect(resolveImageUrl(url, 500)).toContain('/upload/q_auto,f_auto,w_500,c_limit/sample.jpg');
  });

  it('should NOT re-optimize Cloudinary URLs that already have transformations', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/q_80/sample.jpg';
    expect(resolveImageUrl(url, 500)).toBe(url);
  });

  // Edge Case: Empty strings and garbage types
  it('should fallback to placeholder for empty, null, or garbage types', () => {
    expect(resolveImageUrl('')).toContain('hero_casual');
    expect(resolveImageUrl(null)).toContain('hero_casual');
    expect(resolveImageUrl(12345)).toContain('hero_casual');
    expect(resolveImageUrl('   ')).toContain('hero_casual');
  });
});

describe('4. Discount Percent Calculations', () => {
  it('should calculate valid percentages accurately', () => {
    expect(getDiscountPercent(1000, 800)).toBe(20);
    expect(getDiscountPercent(500, 250)).toBe(50);
  });

  // Edge Case: Mathematically broken combinations
  it('should return 0% if discounted price is greater than or equal to original price', () => {
    expect(getDiscountPercent(100, 150)).toBe(0);
    expect(getDiscountPercent(100, 100)).toBe(0);
  });

  it('should return 0% if prices are zero, missing, or negative', () => {
    expect(getDiscountPercent(0, 50)).toBe(0);
    expect(getDiscountPercent(-100, -200)).toBe(0);
    expect(getDiscountPercent(100, null)).toBe(0);
  });
});

describe('5. Phone Normalization & Validation', () => {
  it('should strip out +91, 0, spaces, and hyphens from Indian numbers', () => {
    expect(normalizeIndianPhone('+91 98765-43210')).toBe('9876543210');
    expect(normalizeIndianPhone('09876543210')).toBe('9876543210');
    expect(normalizeIndianPhone('(987) 654 3210')).toBe('9876543210');
  });

  // Edge Case: Random text strings mixed with numbers
  it('should strip completely non-numeric characters', () => {
    expect(normalizeIndianPhone('Call me at 9876543210 please')).toBe('9876543210');
  });

  it('should reject numbers that do not start with 6-9 or are not 10 digits', () => {
    expect(validateIndianPhone('1234567890').valid).toBe(false); // Starts with 1
    expect(validateIndianPhone('98765').valid).toBe(false); // Too short
    expect(validateIndianPhone('9876543210').valid).toBe(true); // Valid
  });
});
