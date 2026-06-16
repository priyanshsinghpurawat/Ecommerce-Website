import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
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
    assert.strictEqual(result.success, true);
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
    assert.strictEqual(result.success, false);
  });
});
