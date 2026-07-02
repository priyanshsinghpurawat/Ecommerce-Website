import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  replacedBy: {
    type: String,
    default: null,
  },
  revoked: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

refreshTokenSchema.index({ token: 1 });
refreshTokenSchema.index({ user: 1, revoked: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);