import { describe, it, expect } from 'vitest';
import { productBodySchema } from '../validators/product.schema.js';

describe('Product Variant Validation', () => {
  it('should validate a product with correct variants', () => {
    const validProduct = {
      title: 'Test Product',
      description: 'A test product description',
      price: 100,
      category: 'cat123',
      subcategory: 'sub123',
      variants: [
        { color: 'Red', size: 'M', sku: 'SKU1', stock: 10, price: 90, images: ['url1'] }
      ]
    };
    const result = productBodySchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('should fail if variant stock is negative', () => {
    const invalidProduct = {
      title: 'Test Product',
      description: 'A test product description',
      price: 100,
      category: 'cat123',
      subcategory: 'sub123',
      variants: [
        { color: 'Red', size: 'M', sku: 'SKU1', stock: -1, price: 90, images: [] }
      ]
    };
    const result = productBodySchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });
});
