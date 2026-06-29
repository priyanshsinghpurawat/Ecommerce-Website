import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

import { Product } from '../models/product.model.js';
import { Variant } from '../models/variant.model.js';
import { MigrationCheckpoint } from '../models/migrationCheckpoint.model.js';
import { VariantFactory } from '../services/variantFactory.js';

const MIGRATION_VERSION = '2026.06.27-variant-separation';
const BATCH_SIZE = 100;

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

async function generateProductCode(product) {
  if (product.productCode) return product.productCode;

  const prefix = product.category
    ? (await mongoose.model('Category').findById(product.category))?.name?.substring(0, 3).toUpperCase() || 'CAT'
    : 'PROD';

  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${suffix}`;
}

function extractOptionsFromVariants(variants) {
  const optionMap = new Map();

  for (const v of variants) {
    if (v.color) {
      if (!optionMap.has('Color')) optionMap.set('Color', new Set());
      optionMap.get('Color').add(v.color);
    }
    if (v.size) {
      if (!optionMap.has('Size')) optionMap.set('Size', new Set());
      optionMap.get('Size').add(v.size);
    }
  }

  return Array.from(optionMap.entries()).map(([name, values]) => ({
    name,
    values: Array.from(values).sort()
  }));
}

function mapOldVariantToNew(oldVariant, productCode, options) {
  const optionValues = {};
  if (oldVariant.color) optionValues.Color = oldVariant.color;
  if (oldVariant.size) optionValues.Size = oldVariant.size;

  const baseSKU = VariantFactory.generateBaseSKU(productCode, optionValues);
  const sku = oldVariant.sku && oldVariant.sku.trim() ? oldVariant.sku.trim() : baseSKU;

  return {
    product: oldVariant._id,
    sku,
    price: oldVariant.price ?? null,
    compareAtPrice: null,
    stock: oldVariant.stock ?? 0,
    optionValues,
    images: oldVariant.images || []
  };
}

async function migrateBatch(products, session) {
  const variantDocs = [];

  for (const product of products) {
    const productCode = await generateProductCode(product);
    const options = extractOptionsFromVariants(product.variants || []);

    await Product.updateOne(
      { _id: product._id },
      {
        $set: {
          productCode,
          options,
          status: 'published',
          variantSummary: {
            minPrice: 0,
            maxPrice: 0,
            colors: [],
            sizes: [],
            totalInventory: 0,
            variantCount: 0
          }
        },
        $unset: { variants: '' }
      },
      { session }
    );

    for (const oldVariant of product.variants || []) {
      const newVariant = mapOldVariantToNew(oldVariant, productCode, options);
      newVariant.product = product._id;
      variantDocs.push(newVariant);
    }
  }

  if (variantDocs.length > 0) {
    await Variant.insertMany(variantDocs, { session, ordered: false });
  }

  return variantDocs.length;
}

async function runMigration() {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log(`Starting migration: ${MIGRATION_VERSION}`);

    let checkpoint = await MigrationCheckpoint.findOne({ version: MIGRATION_VERSION }).session(session);

    if (!checkpoint) {
      const totalProducts = await Product.countDocuments({ variants: { $exists: true, $ne: [] } }).session(session);
      checkpoint = await MigrationCheckpoint.create([{
        version: MIGRATION_VERSION,
        status: 'running',
        totalProducts,
        lastProductId: null,
        startedAt: new Date()
      }], { session });
      checkpoint = checkpoint[0];
      console.log(`Total products to migrate: ${totalProducts}`);
    } else if (checkpoint.status === 'completed') {
      console.log('Migration already completed. Use --force to re-run.');
      await session.abortTransaction();
      return;
    } else {
      console.log(`Resuming migration from product: ${checkpoint.lastProductId}`);
      await MigrationCheckpoint.updateOne(
        { version: MIGRATION_VERSION },
        { $set: { status: 'running' } },
        { session }
      );
    }

    let processedCount = checkpoint.processedProducts || 0;
    let totalVariants = checkpoint.totalVariants || 0;
    let lastId = checkpoint.lastProductId;

    while (true) {
      const query = { variants: { $exists: true, $ne: [] } };
      if (lastId) query._id = { $gt: lastId };

      const products = await Product.find(query)
        .sort({ _id: 1 })
        .limit(BATCH_SIZE)
        .session(session)
        .lean();

      if (!products.length) break;

      console.log(`Processing batch of ${products.length} products...`);

      const variantCount = await migrateBatch(products, session);
      totalVariants += variantCount;
      processedCount += products.length;
      lastId = products[products.length - 1]._id;

      await MigrationCheckpoint.updateOne(
        { version: MIGRATION_VERSION },
        {
          $set: {
            lastProductId: lastId,
            processedProducts: processedCount,
            totalVariants,
            updatedAt: new Date()
          }
        },
        { session }
      );

      console.log(`Processed: ${processedCount}/${checkpoint.totalProducts} products, ${totalVariants} variants created`);
    }

    await Product.recalculateVariantSummary(lastId);

    await MigrationCheckpoint.updateOne(
      { version: MIGRATION_VERSION },
      {
        $set: {
          status: 'completed',
          completedAt: new Date(),
          lastProductId: null
        }
      },
      { session }
    );

    await session.commitTransaction();
    console.log('\n✅ Migration completed successfully!');
    console.log(`Total products processed: ${processedCount}`);
    console.log(`Total variants created: ${totalVariants}`);

  } catch (error) {
    await session.abortTransaction();
    console.error('\n❌ Migration failed:', error.message);

    await MigrationCheckpoint.updateOne(
      { version: MIGRATION_VERSION },
      {
        $set: { status: 'failed' },
        $push: { errors: { message: error.message, timestamp: new Date() } }
      }
    ).catch(() => {});

    throw error;
  } finally {
    session.endSession();
    await mongoose.disconnect();
  }
}

async function rollbackMigration() {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log('Rolling back migration...');

    await Variant.deleteMany({}, { session });

    await Product.updateMany(
      { productCode: { $exists: true } },
      {
        $unset: { productCode: '', options: '', status: '', variantSummary: '' },
        $set: { stock: 10 }
      },
      { session }
    );

    await MigrationCheckpoint.updateOne(
      { version: MIGRATION_VERSION },
      { $set: { status: 'rolled_back', completedAt: new Date() } },
      { session }
    );

    await session.commitTransaction();
    console.log('✅ Rollback completed');
  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Rollback failed:', error.message);
    throw error;
  } finally {
    session.endSession();
    await mongoose.disconnect();
  }
}

const args = process.argv.slice(2);
if (args.includes('--rollback')) {
  rollbackMigration();
} else runMigration();

export { runMigration, rollbackMigration };