import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxLength: [50, "Name cannot exceed 50 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Use a valid email address"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password must be at least 8 characters"],
      select: false // Do not return password in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ["user", "admin", "seller"],
        message: "Role must be either user, admin, or seller"
      },
      default: "user"
    },
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    brandName: {
      type: String,
      trim: true,
      default: ""
    },
    storefront: {
      banner: { type: String, default: "" },
      description: { type: String, default: "" },
      returnPolicy: { type: String, default: "" },
      slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    avatar: {
      type: String,
      default: "" // Cloudinary or local asset URL
    },
    addresses: [
      {
        fullName: { type: String, trim: true },
        phone: { type: String, trim: true },
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
        country: { type: String, default: "India" },
        isDefault: { type: Boolean, default: false }
      }
    ],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      }
    ]
  },
  {
    timestamps: true
  }
);

userSchema.index({ name: 'text', email: 'text' });
userSchema.index({ role: 1, createdAt: -1 });

// Hash password before saving to DB
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate Access Token method
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role
    },
    ENV.JWT_SECRET,
    {
      expiresIn: ENV.JWT_EXPIRY
    }
  );
};

export const User = mongoose.model("User", userSchema);
