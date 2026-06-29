import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required']
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Variant',
      default: null
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    size: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      trim: true
    }
  }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // A user has exactly one cart
    },
    items: [cartItemSchema]
  },
  {
    timestamps: true
  }
);

cartSchema.index({ user: 1, 'items.product': 1, 'items.variant': 1 },
  { unique: true, partialFilterExpression: { 'items.0': { $exists: true } } }
);

export const Cart = mongoose.model('Cart', cartSchema);
