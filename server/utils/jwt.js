import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV } from '../config/env.js';

export function generateAccessToken(user) {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      role: user.role,
    },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRY },
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    {
      _id: user._id,
      jti: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
    },
    ENV.JWT_REFRESH_SECRET || ENV.JWT_SECRET,
    {
      expiresIn: ENV.JWT_REFRESH_EXPIRY,
    },
  );
}

export function generatePasswordResetToken(user) {
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
}
