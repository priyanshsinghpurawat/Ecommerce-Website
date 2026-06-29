import { describe, it, expect, vi } from 'vitest';
import {
  ApiError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ApiResponse,
  asyncHandler,
  slugify,
  normalizeIndianPhone,
  validateIndianPhone,
  normalizeImageUrl,
  mapProductForResponse,
  getUnitPrice,
  computeCartSubtotal,
  safeJSON,
  getCacheHash,
  buildSafeUser,
  generateOrderNumber,
  validateShippingAddress
} from '../../utils/helpers.js';

describe('ApiError', () => {
  it('creates an error with status code and message', () => {
    const err = new ApiError(404, 'Not found');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.success).toBe(false);
    expect(err.errors).toEqual([]);
  });

  it('accepts custom errors array', () => {
    const err = new ApiError(400, 'Validation failed', ['field required']);
    expect(err.errors).toEqual(['field required']);
  });

  it('uses default message when none provided', () => {
    const err = new ApiError(500);
    expect(err.message).toBe('Something went wrong');
  });

  it('captures stack trace', () => {
    const err = new ApiError(400, 'Bad request');
    expect(err.stack).toBeDefined();
    expect(typeof err.stack).toBe('string');
    expect(err.stack.length).toBeGreaterThan(0);
  });
});

describe('ApiError subclasses', () => {
  it('ValidationError has 400 status', () => {
    const err = new ValidationError('Invalid input');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Invalid input');
  });

  it('NotFoundError has 404 status', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Resource not found');
  });

  it('UnauthorizedError has 401 status', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Unauthorized request');
  });

  it('ForbiddenError has 403 status', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('Access forbidden');
  });

  it('ConflictError has 409 status', () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe('Conflict detected');
  });
});

describe('ApiResponse', () => {
  it('creates a response with success true for 2xx status', () => {
    const res = new ApiResponse(200, { id: 1 }, 'OK');
    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual({ id: 1 });
    expect(res.message).toBe('OK');
    expect(res.success).toBe(true);
  });

  it('creates a response with success false for 4xx status', () => {
    const res = new ApiResponse(400, null, 'Bad');
    expect(res.success).toBe(false);
  });

  describe('static helpers', () => {
    it('success() sends JSON response', () => {
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      ApiResponse.success(res, { user: 'test' }, 'OK', 200);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ user: 'test' });
    });

    it('created() sends 201 response', () => {
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      ApiResponse.created(res, { id: 1 });
      expect(res.status).toHaveBeenCalledWith(201);
      const body = res.json.mock.calls[0][0];
      expect(body.statusCode).toBe(201);
    });

    it('paginated() wraps items with pagination metadata', () => {
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      ApiResponse.paginated(res, [1, 2, 3], 1, 10, 25);
      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.data.items).toEqual([1, 2, 3]);
      expect(body.data.pagination).toEqual({ page: 1, limit: 10, total: 25, pages: 3 });
    });
  });
});

describe('asyncHandler', () => {
  it('calls the handler and returns a middleware', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const middleware = asyncHandler(handler);
    expect(typeof middleware).toBe('function');
  });

  it('catches errors and calls next', async () => {
    const error = new ApiError(400, 'Bad');
    const handler = vi.fn().mockRejectedValue(error);
    const next = vi.fn();
    const middleware = asyncHandler(handler);
    await middleware({}, {}, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('slugify', () => {
  it('converts text to lowercase slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('Hello! @World#')).toBe('hello-world');
  });

  it('handles empty/null input', () => {
    expect(slugify('')).toBe('');
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
  });

  it('trims whitespace', () => {
    expect(slugify('  Hello World  ')).toBe('hello-world');
  });

  it('collapses multiple dashes', () => {
    expect(slugify('a---b')).toBe('a-b');
  });
});

describe('normalizeIndianPhone', () => {
  it('strips +91 prefix', () => {
    expect(normalizeIndianPhone('+919876543210')).toBe('9876543210');
  });

  it('strips leading 0', () => {
    expect(normalizeIndianPhone('09876543210')).toBe('9876543210');
  });

  it('removes non-numeric characters', () => {
    expect(normalizeIndianPhone('(987) 654-3210')).toBe('9876543210');
  });

  it('handles empty input', () => {
    expect(normalizeIndianPhone('')).toBe('');
  });

  it('handles null/undefined input', () => {
    expect(normalizeIndianPhone(null)).toBe('');
    expect(normalizeIndianPhone(undefined)).toBe('');
  });
});

describe('validateIndianPhone', () => {
  it('returns digits for valid phone', () => {
    expect(validateIndianPhone('9876543210')).toBe('9876543210');
  });

  it('throws for invalid phone starting with 1-5', () => {
    expect(() => validateIndianPhone('1234567890')).toThrow('Enter a valid 10-digit Indian mobile number');
  });

  it('throws for short phone', () => {
    expect(() => validateIndianPhone('98765')).toThrow();
  });

  it('throws for non-numeric input', () => {
    expect(() => validateIndianPhone('abcdefghij')).toThrow();
  });
});

describe('normalizeImageUrl', () => {
  it('returns placeholder for null/undefined', () => {
    expect(normalizeImageUrl(null)).toContain('hero_casual');
    expect(normalizeImageUrl(undefined)).toContain('hero_casual');
  });

  it('returns placeholder for empty string', () => {
    expect(normalizeImageUrl('')).toContain('hero_casual');
  });

  it('returns placeholder for non-string', () => {
    expect(normalizeImageUrl(123)).toContain('hero_casual');
  });

  it('returns menshirt.avif for mens_shirt.png', () => {
    expect(normalizeImageUrl('mens_shirt.png')).toBe('/assets/menshirt.avif');
    expect(normalizeImageUrl('/path/mens_shirt.png')).toContain('menshirt.avif');
  });

  it('passes through http URLs', () => {
    expect(normalizeImageUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
  });

  it('passes through absolute paths', () => {
    expect(normalizeImageUrl('/assets/image.png')).toBe('/assets/image.png');
  });

  it('prepends /assets/ to bare filenames', () => {
    expect(normalizeImageUrl('shirt.jpg')).toBe('/assets/shirt.jpg');
  });

  it('returns placeholder for unrecognized strings', () => {
    expect(normalizeImageUrl('random-text')).toContain('hero_casual');
  });
});

describe('mapProductForResponse', () => {
  it('returns null for null product', () => {
    expect(mapProductForResponse(null)).toBeNull();
  });

  it('normalizes product image', () => {
    const product = { image: 'shirt.jpg', images: ['banner.jpg'] };
    const result = mapProductForResponse(product);
    expect(result.image).toBe('/assets/shirt.jpg');
    expect(result.images[0]).toBe('/assets/banner.jpg');
  });

  it('normalizes variant images', () => {
    const product = {
      image: 'test.jpg',
      variants: [{ images: ['variant1.jpg', 'variant2.jpg'] }]
    };
    const result = mapProductForResponse(product);
    expect(result.variants[0].images[0]).toBe('/assets/variant1.jpg');
  });

  it('handles product without toObject method', () => {
    const product = { image: 'test.jpg' };
    const result = mapProductForResponse(product);
    expect(result.image).toBe('/assets/test.jpg');
  });
});

describe('getUnitPrice', () => {
  it('returns discountedPrice when available', () => {
    expect(getUnitPrice({ price: 1000, discountedPrice: 800 })).toBe(800);
  });

  it('returns price when discountedPrice is null', () => {
    expect(getUnitPrice({ price: 1000, discountedPrice: null })).toBe(1000);
  });

  it('returns price when discountedPrice is undefined', () => {
    expect(getUnitPrice({ price: 1000 })).toBe(1000);
  });
});

describe('computeCartSubtotal', () => {
  it('calculates subtotal from cart items', () => {
    const items = [
      { product: { price: 1000 }, quantity: 2 },
      { product: { price: 500, discountedPrice: 300 }, quantity: 1 }
    ];
    expect(computeCartSubtotal(items)).toBe(2300);
  });

  it('skips items without product', () => {
    const items = [
      { product: null, quantity: 1 },
      { product: { price: 500 }, quantity: 1 }
    ];
    expect(computeCartSubtotal(items)).toBe(500);
  });

  it('returns 0 for empty items', () => {
    expect(computeCartSubtotal([])).toBe(0);
    expect(computeCartSubtotal()).toBe(0);
  });
});

describe('safeJSON', () => {
  it('parses valid JSON', () => {
    expect(safeJSON('{"a":1}', {})).toEqual({ a: 1 });
  });

  it('returns fallback for invalid JSON', () => {
    expect(safeJSON('not-json', [])).toEqual([]);
  });

  it('returns fallback for null/undefined', () => {
    expect(safeJSON(null, 'default')).toBe('default');
    expect(safeJSON(undefined, 'default')).toBe('default');
  });

  it('returns fallback for empty string', () => {
    expect(safeJSON('', 'fallback')).toBe('fallback');
  });

  it('returns non-string values as-is', () => {
    expect(safeJSON(42, 0)).toBe(42);
  });
});

describe('getCacheHash', () => {
  it('generates consistent hash for same params', () => {
    const hash1 = getCacheHash({ a: '1', b: '2' });
    const hash2 = getCacheHash({ a: '1', b: '2' });
    expect(hash1).toBe(hash2);
  });

  it('generates different hash for different params', () => {
    const hash1 = getCacheHash({ a: '1' });
    const hash2 = getCacheHash({ a: '2' });
    expect(hash1).not.toBe(hash2);
  });

  it('is order-independent', () => {
    const hash1 = getCacheHash({ b: '2', a: '1' });
    const hash2 = getCacheHash({ a: '1', b: '2' });
    expect(hash1).toBe(hash2);
  });
});

describe('buildSafeUser', () => {
  it('extracts safe fields from user object', () => {
    const user = {
      _id: '123',
      name: 'Test',
      email: 'test@test.com',
      role: 'user',
      password: 'secret123',
      phone: '9876543210',
      brandName: 'Brand',
      avatar: 'url',
      isActive: true,
      addresses: [],
      wishlist: [],
      storefront: {},
      createdAt: new Date()
    };
    const safe = buildSafeUser(user);
    expect(safe._id).toBe('123');
    expect(safe.name).toBe('Test');
    expect(safe).not.toHaveProperty('password');
    expect(safe).not.toHaveProperty('createdAt');
  });
});

describe('generateOrderNumber', () => {
  it('generates order number with BL- prefix', () => {
    const orderNum = generateOrderNumber();
    expect(orderNum).toMatch(/^BL-[A-Z0-9]+-[A-Z0-9]+$/);
  });

  it('generates unique order numbers', () => {
    const nums = new Set();
    for (let i = 0; i < 100; i++) nums.add(generateOrderNumber());
    expect(nums.size).toBe(100);
  });
});

describe('validateShippingAddress', () => {
  it('passes for valid address', () => {
    const addr = {
      fullName: 'Test User',
      phone: '9876543210',
      street: '123 Main St',
      city: 'Mumbai',
      state: 'MH',
      zipCode: '400001'
    };
    expect(() => validateShippingAddress(addr)).not.toThrow();
  });

  it('throws for missing fields', () => {
    expect(() => validateShippingAddress({})).toThrow();
    expect(() => validateShippingAddress({ fullName: 'Test' })).toThrow();
  });

  it('throws for empty trimmed fields', () => {
    const addr = {
      fullName: '  ',
      phone: '9876543210',
      street: '123 Main St',
      city: 'Mumbai',
      state: 'MH',
      zipCode: '400001'
    };
    expect(() => validateShippingAddress(addr)).toThrow();
  });

  it('throws for invalid phone in address', () => {
    const addr = {
      fullName: 'Test User',
      phone: '12345',
      street: '123 Main St',
      city: 'Mumbai',
      state: 'MH',
      zipCode: '400001'
    };
    expect(() => validateShippingAddress(addr)).toThrow();
  });
});
