import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxLength: [120, 'Product title cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    productCode: {
      type: String,
      required: [true, 'Product code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 32,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Original price cannot be negative'],
    },
    stock: {
      type: Number,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    discountedPrice: {
      type: Number,
      default: null,
      min: [0, 'Discounted price cannot be negative'],
    },
    image: {
      type: String,
      required: [true, 'Product image URL is required'],
      default: '/assets/hero_casual.png',
    },
    images: {
      type: [String],
      default: [],
      validate: [(v) => v.length <= 10, 'Cannot exceed 10 images'],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    variantSummary: {
      minPrice: { type: Number, default: 0 },
      maxPrice: { type: Number, default: 0 },
      colors: { type: [String], default: [] },
      sizes: { type: [String], default: [] },
      colorImages: { type: Map, of: String, default: {} },
      totalInventory: { type: Number, default: 0 },
      variantCount: { type: Number, default: 0 },
    },
    badge: {
      type: String,
      enum: ['', 'new-arrival', 'sale', 'street-drip', 'limited-edition'],
      default: '',
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0,
    },
    reviewCount: {
      type: Number,
      min: [0, 'Review count cannot be negative'],
      default: 0,
    },
    soldCount: {
      type: Number,
      min: [0, 'Sold count cannot be negative'],
      default: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory',
      required: [true, 'Product subcategory is required'],
    },
    gender: {
      type: String,
      enum: ['men', 'women', 'unisex'],
      default: 'men',
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Product seller is required'],
    },
    relatedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  { timestamps: true },
);

productSchema.index({ category: 1 });
productSchema.index({ subcategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ price: 1, category: 1 });
productSchema.index({ badge: 1, createdAt: -1 });
productSchema.index({ rating: -1, soldCount: -1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ 'variantSummary.colors': 1 });
productSchema.index({ 'variantSummary.minPrice': 1, 'variantSummary.maxPrice': 1 });

productSchema.pre('validate', async function (next) {
  if (
    this.discountedPrice !== undefined &&
    this.discountedPrice !== null &&
    this.discountedPrice >= this.price
  ) {
    this.invalidate(
      'discountedPrice',
      `Discounted price (${this.discountedPrice}) must be strictly less than the original price (${this.price})`,
    );
  }

  if (this.title && (this.isModified('title') || !this.slug)) {
    let base = slugify(this.title, { lower: true, strict: true });
    let slug = base;
    let counter = 1;
    // Keep checking until we find a unique slug
    while (await mongoose.model('Product').exists({ slug, _id: { $ne: this._id } })) {
      slug = `${base}-${counter++}`;
    }
    this.slug = slug;
  }

  if (this.title && !this.productCode) {
    const prefix = this.category ? this.category.toString().substring(0, 3).toUpperCase() : 'PROD';
    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.productCode = `${prefix}-${suffix}`;
  }

  next();
});

productSchema.statics.recalculateVariantSummary = async function (productId, session = null) {
  const Variant = mongoose.model('Variant');

  let aggQuery = Variant.aggregate([
    { $match: { product: productId, deletedAt: null, status: 'active' } },
    {
      $group: {
        _id: '$product',
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        colors: { $addToSet: '$optionValues.Color' },
        sizes: { $addToSet: '$optionValues.Size' },
        totalInventory: { $sum: '$stock' },
        variantCount: { $sum: 1 },
        firstImages: {
          $push: {
            color: '$optionValues.Color',
            image: { $arrayElemAt: ['$images', 0] },
          },
        },
      },
    },
  ]);

  if (session) {
    aggQuery = aggQuery.session(session);
  }

  const agg = await aggQuery;

  const summary = agg[0] || {
    minPrice: 0,
    maxPrice: 0,
    colors: [],
    sizes: [],
    totalInventory: 0,
    variantCount: 0,
    firstImages: [],
  };

  // Build colorImages map: color → first image URL
  const colorImages = {};
  for (const entry of summary.firstImages || []) {
    if (entry.color && entry.image && !colorImages[entry.color]) {
      colorImages[entry.color] = entry.image;
    }
  }

  // Clean null/undefined from arrays
  summary.colors = (summary.colors || []).filter(Boolean);
  summary.sizes = (summary.sizes || []).filter(Boolean);

  await this.updateOne(
    { _id: productId },
    {
      $set: {
        variantSummary: {
          minPrice: summary.minPrice || 0,
          maxPrice: summary.maxPrice || 0,
          colors: summary.colors,
          sizes: summary.sizes,
          colorImages,
          totalInventory: summary.totalInventory || 0,
          variantCount: summary.variantCount || 0,
        },
        stock: summary.totalInventory || 0,
      },
    },
    { session },
  );
};

export const Product = mongoose.model('Product', productSchema);
