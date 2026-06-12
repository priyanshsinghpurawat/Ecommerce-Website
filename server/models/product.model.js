import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      maxLength: [120, "Product title cannot exceed 120 characters"]
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Original price cannot be negative"]
    },
    discountedPrice: {
      type: Number,
      default: null,
      min: [0, "Discounted price cannot be negative"]
    },
    image: {
      type: String,
      required: [true, "Product image URL is required"],
      default: '/assets/hero_casual.png'
    },
    images: {
      type: [String],
      default: [],
      validate: [v => v.length <= 10, 'Cannot exceed 10 images']
    },
    /**
     * Powerlook style variants. Each variant carries its own gallery,
     * stock and optional price override. Flat `images[]` remains as a
     * fallback gallery so existing products keep rendering unchanged.
     */
    variants: [
      {
        color: { type: String, trim: true, default: '' },
        size: { type: String, trim: true, default: '' },
        sku: { type: String, trim: true, default: '' },
        stock: { type: Number, min: 0, default: 0 },
        price: { type: Number, min: 0, default: null },
        images: { type: [String], default: [] }
      }
    ],
    badge: {
      type: String,
      enum: ['', 'new-arrival', 'sale', 'street-drip', 'limited-edition'],
      default: ''
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0
    },
    reviewCount: {
      type: Number,
      min: [0, 'Review count cannot be negative'],
      default: 0
    },
    soldCount: {
      type: Number,
      min: [0, 'Sold count cannot be negative'],
      default: 0
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"]
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      required: [true, "Product subcategory is required"]
    },
    gender: {
      type: String,
      enum: ['men', 'women', 'unisex'],
      default: 'men'
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 10
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "Product seller is required"]
    },
    /**
     * Curated cross-sell items (Frequently Bought Together / Complete the Look).
     */
    relatedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ]
  },
  { timestamps: true }
);

// Indexing strategy for query performance optimization under high catalog load
productSchema.index({ category: 1 });
productSchema.index({ subcategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ price: 1, category: 1 });           // Price range + category filter
productSchema.index({ 'variants.color': 1 });             // Color filter
productSchema.index({ badge: 1, createdAt: -1 });         // Badge + sort
productSchema.index({ rating: -1, soldCount: -1 });       // Popularity sort

// Mongoose validation hook for pricing logic
productSchema.pre("validate", function (next) {
  // Ensure that discountedPrice is strictly less than price
  if (this.discountedPrice !== undefined && this.discountedPrice >= this.price) {
    this.invalidate(
      "discountedPrice",
      `Discounted price (${this.discountedPrice}) must be strictly less than the original price (${this.price})`
    );
  }
  next();
});

export const Product = mongoose.model("Product", productSchema);
