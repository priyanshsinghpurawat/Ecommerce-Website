import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { asyncHandler, ApiError, ApiResponse, buildSafeUser } from '../utils/helpers.js';
import { User } from '../models/user.model.js';
import { RefreshToken } from '../models/refreshToken.model.js';
import { OAuth2Client } from 'google-auth-library';
import { ENV } from '../config/env.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generatePasswordResetToken,
} from '../utils/jwt.js';

const client = new OAuth2Client(ENV.GOOGLE_CLIENT_ID);

const accessCookieOptions = {
  httpOnly: true,
  secure: ENV.NODE_ENV === 'production',
  sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 15 * 60 * 1000,
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: ENV.NODE_ENV === 'production',
  sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/api/v3/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const createRefreshTokenDoc = async (userId) => {
  const user = await User.findById(userId);
  const refreshToken = generateRefreshToken(user);
  const decoded = jwt.decode(refreshToken);
  await RefreshToken.create({
    user: userId,
    token: refreshToken,
    expiresAt: new Date(decoded.exp * 1000),
  });
  return refreshToken;
};

const sendAuthResponse = async (res, statusCode, user, accessToken, message) => {
  const refreshToken = await createRefreshTokenDoc(user._id);

  return res
    .status(statusCode)
    .cookie('token', accessToken, accessCookieOptions)
    .cookie('refreshToken', refreshToken, refreshCookieOptions)
    .json(new ApiResponse(statusCode, { user }, message));
};

export const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: ENV.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { name, email, picture, email_verified } = payload;

    // Reject accounts with unverified emails to prevent hijacking
    if (!email_verified) {
      throw new ApiError(401, 'Google account email is not verified.');
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        avatar: picture,
        password: crypto.randomBytes(32).toString('hex'),
        role: 'user',
      });
    } else {
      if (!user.avatar) {
        user.avatar = picture;
        await user.save();
      }
    }

    const token = generateAccessToken(user);

    return await sendAuthResponse(res, 200, buildSafeUser(user), token, 'Welcome back via Google.');
  } catch {
    throw new ApiError(401, 'Google authentication failed. Please try again.');
  }
});

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, 'That email is already registered. Try logging in.');
  }

  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: 'user',
  });

  const token = generateAccessToken(user);

  return await sendAuthResponse(res, 201, buildSafeUser(user), token, 'Account created.');
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Email or password is wrong.');
  }

  const passwordOk = await user.isPasswordCorrect(password);
  if (!passwordOk) {
    throw new ApiError(401, 'Email or password is wrong.');
  }

  const token = generateAccessToken(user);

  return await sendAuthResponse(res, 200, buildSafeUser(user), token, 'Welcome back.');
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const safeUser = buildSafeUser(req.user);
  return res.status(200).json(new ApiResponse(200, safeUser, 'OK'));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'If that email is registered, a reset link has been sent.'));
  }

  const resetToken = generatePasswordResetToken(user);
  await user.save({ validateBeforeSave: false });

  const clientUrl = ENV.CORS_ORIGIN?.replace(/\/+$/, '') || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl);
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'If that email is registered, a reset link has been sent.'));
  } catch {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, 'Failed to send reset email. Please try again.');
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+password');

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token.');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const jwtToken = generateAccessToken(user);

  return await sendAuthResponse(
    res,
    200,
    buildSafeUser(user),
    jwtToken,
    'Password reset successfully.',
  );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken;

  if (!incomingToken) {
    throw new ApiError(401, 'Refresh token not found.');
  }

  const stored = await RefreshToken.findOne({ token: incomingToken, revoked: false });
  if (!stored) {
    throw new ApiError(401, 'Invalid or revoked refresh token.');
  }

  if (stored.expiresAt < new Date()) {
    await stored.deleteOne();
    throw new ApiError(401, 'Refresh token expired.');
  }

  try {
    const decoded = jwt.verify(incomingToken, ENV.JWT_REFRESH_SECRET || ENV.JWT_SECRET);

    const user = await User.findById(decoded._id);
    if (!user) {
      throw new ApiError(401, 'User not found.');
    }

    // Rotate the refresh token
    stored.revoked = true;
    await stored.save();

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await createRefreshTokenDoc(user._id);

    return res
      .status(200)
      .cookie('token', newAccessToken, accessCookieOptions)
      .cookie('refreshToken', newRefreshToken, refreshCookieOptions)
      .json(new ApiResponse(200, { user: buildSafeUser(user) }, 'Token refreshed.'));
  } catch {
    await stored.deleteOne();
    throw new ApiError(401, 'Invalid refresh token.');
  }
});

export const revokeAllSessions = asyncHandler(async (req, res) => {
  await RefreshToken.updateMany({ user: req.user._id, revoked: false }, { revoked: true });

  return res
    .status(200)
    .clearCookie('token', accessCookieOptions)
    .clearCookie('refreshToken', { ...refreshCookieOptions, path: '/api/v3/auth' })
    .json(new ApiResponse(200, null, 'All sessions revoked.'));
});

export const logoutUser = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    await RefreshToken.updateOne({ token: refreshToken }, { revoked: true });
  }

  return res
    .status(200)
    .clearCookie('token', accessCookieOptions)
    .clearCookie('refreshToken', { ...refreshCookieOptions, path: '/api/v3/auth' })
    .json(new ApiResponse(200, null, 'Logged out'));
});
