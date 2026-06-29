import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { resolveVariant, deductStock, restoreStock, incrementProductSales } from '../../services/order.service.js';
import { Product } from '../../models/product.model.js';
import { Variant } from '../../models/variant.model.js';
import { User } from '../../models/user.model.js';
import { Category } from '../../models/category.model.js';
import { Subcategory } from '../../models/subcategory.model.js';

let mongod, user, category, subcategory;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  user = await User.create({ name: 'S', email: 'svc@test.com', password: 'Password@1', role: 'seller' });
  category = await Category.create({ name: 'Svc Cat' });
  subcategory = await Subcategory.create({ name: 'Svc Sub', category: category._id });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Variant.deleteMany({});
  await Product.deleteMany({});
});

const makeProduct = (overrides = {}) => Product.create({
  title: 'Svc Product', description: 'Test', price: 500, stock: 20, image: '/t.jpg',
  category: category._id, subcategory: subcategory._id, seller: user._id, productCode: `SP-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
  ...overrides
});

describe('resolveVariant', () => {
  it('resolves variant by direct reference', async () => {
    const product = await makeProduct();
    const variant = await Variant.create({
      product: product._id, sku: 'RES-1', stock: 10,
      optionValues: new Map([['Color', 'Red']])
    });
    const item = { variant: variant._id };
    const result = await resolveVariant(item);
    expect(result._id.toString()).toBe(variant._id.toString());
  });

  it('resolves variant by optionValues when no direct ref', async () => {
    const product = await makeProduct();
    await Variant.create({
      product: product._id, sku: 'OPT-1', stock: 5,
      optionValues: new Map([['Color', 'Blue'], ['Size', 'M']])
    });
    const item = { product: { _id: product._id }, color: 'Blue', size: 'M' };
    const result = await resolveVariant(item);
    expect(result).not.toBeNull();
    expect(result.sku).toBe('OPT-1');
  });

  it('returns null when no variant info', async () => {
    const result = await resolveVariant({ product: { _id: new mongoose.Types.ObjectId() } });
    expect(result).toBeNull();
  });
});

describe('deductStock', () => {
  it('deducts stock from product when no variant', async () => {
    const product = await makeProduct({ stock: 10 });
    await deductStock([{ product: { _id: product._id }, quantity: 3, title: 'Test' }], null);
    const updated = await Product.findById(product._id);
    expect(updated.stock).toBe(7);
  });

  it('deducts stock from variant', async () => {
    const product = await makeProduct({ stock: 0 });
    const variant = await Variant.create({
      product: product._id, sku: 'DED-1', stock: 15,
      optionValues: new Map([['Color', 'Green']])
    });
    await deductStock([{ variant: variant._id, product: { _id: product._id }, quantity: 5, title: 'V' }], null);
    const updated = await Variant.findById(variant._id);
    expect(updated.stock).toBe(10);
  });

  it('throws when stock is insufficient', async () => {
    const product = await makeProduct({ stock: 2 });
    await expect(deductStock([{ product: { _id: product._id }, quantity: 5, title: 'X' }], null))
      .rejects.toThrow('Insufficient stock');
  });
});

describe('restoreStock', () => {
  it('restores stock to product', async () => {
    const product = await makeProduct({ stock: 5 });
    await restoreStock([{ product: { _id: product._id }, quantity: 3 }], null);
    const updated = await Product.findById(product._id);
    expect(updated.stock).toBe(8);
  });

  it('restores stock to variant', async () => {
    const product = await makeProduct({ stock: 0 });
    const variant = await Variant.create({
      product: product._id, sku: 'RST-1', stock: 5,
      optionValues: new Map([['Color', 'Red']])
    });
    await restoreStock([{ variant: variant._id, product: { _id: product._id }, quantity: 2 }], null);
    const updated = await Variant.findById(variant._id);
    expect(updated.stock).toBe(7);
  });
});

describe('incrementProductSales', () => {
  it('increments soldCount on products', async () => {
    const product = await makeProduct({ soldCount: 0 });
    await incrementProductSales([{ product: { _id: product._id }, quantity: 5 }], null);
    const updated = await Product.findById(product._id);
    expect(updated.soldCount).toBe(5);
  });

  it('handles empty items array', async () => {
    await expect(incrementProductSales([], null)).resolves.not.toThrow();
  });
});
