import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Variant',
      default: null
    },
    sku: { type: String, trim: true },
    title: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true },
    discountedPrice: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    size: { type: String, trim: true },
    color: { type: String, trim: true },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'confirmed'
    },
    returnStatus: {
      type: String,
      enum: ['none', 'requested', 'approved', 'rejected', 'refunded'],
      default: 'none'
    },
    returnReason: {
      type: String,
      trim: true
    },
    trackingNumber: { type: String, trim: true },
    deliveryDate: { type: Date }
  }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, default: 'India', trim: true }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon'
    },
    couponCode: { type: String, trim: true, uppercase: true },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cod', 'demo'],
      default: 'cod'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    trackingNumber: { type: String, trim: true },
    deliveryDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'partially_shipped', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    attributionTag: {
      type: String,
      trim: true,
      default: null
    }
  },
  { timestamps: true }
);

// Optimize retrieval of order history (most recent orders first for a specific user)
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ trackingNumber: 1 });
orderSchema.index({ "items.product": 1 }); // Optimize vendor queries
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
