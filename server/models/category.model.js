import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
      maxLength: [32, "Category name cannot exceed 32 characters"]
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name);
  }
  next();
});

export const Category = mongoose.model("Category", categorySchema);
