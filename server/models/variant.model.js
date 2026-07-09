import mongoose from 'mongoose';
import logger from '../config/logger.js';

const variantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 64,
      index: true,
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      default: null,
    },
    compareAtPrice: {
      type: Number,
      min: [0, 'Compare at price cannot be negative'],
      default: null,
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    optionValues: {
      type: Map,
      of: String,
      default: {},
    },
    images: {
      type: [String],
      default: [],
      validate: [(v) => v.length <= 8, 'Cannot exceed 8 variant images'],
    },
    skuLocked: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

variantSchema.index({ product: 1, 'optionValues.Color': 1, 'optionValues.Size': 1 });
variantSchema.index(
  { product: 1, sku: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);

variantSchema.pre(/^find/, function (next) {
  const query = this.getQuery();
  if (query.deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
});

variantSchema.post('save', async function (doc) {
  if (doc && !doc.deletedAt) {
    try {
      const Product = mongoose.model('Product');
      await Product.recalculateVariantSummary(doc.product);
    } catch (err) {
      logger.error('[Variant] Failed to recalculate product summary:', err.message);
    }
  }
});

variantSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    try {
      const Product = mongoose.model('Product');
      await Product.recalculateVariantSummary(doc.product);
    } catch (err) {
      logger.error('[Variant] Failed to recalculate product summary after delete:', err.message);
    }
  }
});

variantSchema.statics.findByProductAndOptions = function (productId, optionValues) {
  const query = { product: productId, deletedAt: null };
  if (optionValues) {
    for (const [key, value] of Object.entries(optionValues)) {
      query[`optionValues.${key}`] = value;
    }
  }
  return this.findOne(query);
};

variantSchema.statics.findActiveByProduct = function (productId) {
  return this.find({ product: productId, deletedAt: null, status: 'active' }).sort({
    createdAt: 1,
  });
};

variantSchema.statics.bulkUpdateStock = async function (updates) {
  const bulkOps = updates.map(({ variantId, quantity }) => ({
    updateOne: {
      filter: { _id: variantId, stock: { $gte: Math.abs(quantity) } },
      update: { $inc: { stock: quantity } },
    },
  }));
  if (bulkOps.length === 0) return { matchedCount: 0, modifiedCount: 0 };
  return this.bulkWrite(bulkOps);
};

export const Variant = mongoose.model('Variant', variantSchema);
