import mongoose from 'mongoose';
import slugify from 'slugify';

const subcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: [48, 'Subcategory name too long'],
    },
    slug: { type: String, unique: true, lowercase: true, index: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
  },
  { timestamps: true },
);

subcategorySchema.index({ name: 1, category: 1 }, { unique: true });

subcategorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export const Subcategory = mongoose.model('Subcategory', subcategorySchema);
