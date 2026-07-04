import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true },
);

newsletterSchema.index({ email: 1 });

export const Newsletter = mongoose.model('Newsletter', newsletterSchema);
