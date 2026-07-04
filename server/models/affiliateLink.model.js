import mongoose from 'mongoose';

const affiliateLinkSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // The specific product they are promoting (optional, could be general store link)
    targetProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    // The actual URL being promoted
    targetUrl: {
      type: String,
      required: true,
    },
    // The unique tag generated (e.g., 'Seller123-ig-summer')
    trackingTag: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    // Human-readable name for the seller to identify the campaign
    campaignName: {
      type: String,
      required: true,
      trim: true,
    },
    // Performance metrics updated asynchronously or via ledger/cron
    metrics: {
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      revenueGenerated: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Index for quickly finding all links for a specific seller, sorted by creation date
affiliateLinkSchema.index({ seller: 1, createdAt: -1 });

export const AffiliateLink = mongoose.model('AffiliateLink', affiliateLinkSchema);
