import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      trim: true,
      uppercase: true, // Auto uppercase coupon codes
      maxLength: [20, 'Coupon code cannot exceed 20 characters']
    },
    discountType: {
      type: String,
      required: [true, 'Discount type is required'],
      enum: {
        values: ['percentage', 'flat'],
        message: 'Discount type must be either percentage or flat'
      },
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative']
    },
    minCartAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order amount cannot be negative']
    },
    expiryDate: {
      type: Date
    },
    usageLimit: {
      type: Number,
      default: null // null means infinite
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, 'Usage count cannot be negative']
    },
    perUserLimit: {
      type: Number,
      default: 1,
      min: [1, 'Per user limit must be at least 1']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    appliedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ]
  },
  {
    timestamps: true
  }
);

export const Coupon = mongoose.model('Coupon', couponSchema);
