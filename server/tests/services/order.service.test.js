import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  resolveVariant,
  deductStock,
  restoreStock,
  incrementProductSales,
  calculateOrderTotals,
  createLedgerEntries,
} from '../../services/order.service.js';
import { Product } from '../../models/product.model.js';
import { Variant } from '../../models/variant.model.js';
import { User } from '../../models/user.model.js';
import { Category } from '../../models/category.model.js';
import { Subcategory } from '../../models/subcategory.model.js';
import { LedgerTransaction } from '../../models/ledger.model.js';

let mongod, user, category, subcategory;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  user = await User.create({
    name: 'S',
    email: 'svc@test.com',
    password: 'Password@1',
    role: 'seller',
  });
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

const makeProduct = (overrides = {}) =>
  Product.create({
    title: 'Svc Product',
    description: 'Test',
    price: 500,
    stock: 20,
    image: '/t.jpg',
    category: category._id,
    subcategory: subcategory._id,
    seller: user._id,
    productCode: `SP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...overrides,
  });

describe('resolveVariant', () => {
  it('resolves variant by direct reference', async () => {
    const product = await makeProduct();
    const variant = await Variant.create({
      product: product._id,
      sku: 'RES-1',
      stock: 10,
      optionValues: new Map([['Color', 'Red']]),
    });
    const item = { variant: variant._id };
    const result = await resolveVariant(item);
    expect(result._id.toString()).toBe(variant._id.toString());
  });

  it('resolves variant by optionValues when no direct ref', async () => {
    const product = await makeProduct();
    await Variant.create({
      product: product._id,
      sku: 'OPT-1',
      stock: 5,
      optionValues: new Map([
        ['Color', 'Blue'],
        ['Size', 'M'],
      ]),
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
      product: product._id,
      sku: 'DED-1',
      stock: 15,
      optionValues: new Map([['Color', 'Green']]),
    });
    await deductStock(
      [{ variant: variant._id, product: { _id: product._id }, quantity: 5, title: 'V' }],
      null,
    );
    const updated = await Variant.findById(variant._id);
    expect(updated.stock).toBe(10);
  });

  it('throws when stock is insufficient', async () => {
    const product = await makeProduct({ stock: 2 });
    await expect(
      deductStock([{ product: { _id: product._id }, quantity: 5, title: 'X' }], null),
    ).rejects.toThrow('Insufficient stock');
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
      product: product._id,
      sku: 'RST-1',
      stock: 5,
      optionValues: new Map([['Color', 'Red']]),
    });
    await restoreStock(
      [{ variant: variant._id, product: { _id: product._id }, quantity: 2 }],
      null,
    );
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

describe('calculateOrderTotals', () => {
  it('calculates order subtotal using variant price instead of product price', async () => {
    const product = await makeProduct({ price: 500 });
    const variant = await Variant.create({
      product: product._id,
      sku: 'VAR-PR-1',
      price: 600,
      stock: 10,
      optionValues: new Map([['Color', 'Black']]),
    });

    const mockCart = {
      items: [
        {
          product: product,
          variant: variant,
          quantity: 2,
        },
      ],
    };

    const totals = await calculateOrderTotals(mockCart, null, null);
    expect(totals.subtotal).toBe(1200); // 600 * 2
    expect(totals.orderItems[0].unitPrice).toBe(600);
    expect(totals.orderItems[0].seller.toString()).toBe(product.seller.toString());
  });
});

describe('createLedgerEntries', () => {
  it('creates ledger entries with correct seller field alignment', async () => {
    await LedgerTransaction.deleteMany({});
    const orderId = new mongoose.Types.ObjectId();
    const sellerId = new mongoose.Types.ObjectId();
    const orderItems = [
      {
        seller: sellerId,
        subtotal: 1000,
      },
    ];

    await createLedgerEntries(orderId, 'TEST-ORDER-1', orderItems, 'cod', null);

    const entries = await LedgerTransaction.find({ order: orderId });
    expect(entries.length).toBe(2);

    const sale = entries.find((e) => e.type === 'sale');
    expect(sale).toBeDefined();
    expect(sale.seller.toString()).toBe(sellerId.toString());
    expect(sale.amount).toBe(100000); // 1000 * 100 paise
    expect(sale.status).toBe('pending'); // COD order

    const comm = entries.find((e) => e.type === 'commission_fee');
    expect(comm).toBeDefined();
    expect(comm.seller.toString()).toBe(sellerId.toString());
    expect(comm.amount).toBe(-10000); // 10% platform fee
  });
});
