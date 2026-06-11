import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { User } from '../models/user.model.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000
};

const sendAuthResponse = (res, statusCode, user, token, message) =>
  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json(new ApiResponse(statusCode, { user, token }, message));

export const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw new ApiError(400, 'Google token is missing.');
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const { name, email, picture, sub: googleId } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        name,
        email,
        avatar: picture,
        password: crypto.randomBytes(32).toString('hex'), // Secure random password for social login
        role: 'user'
      });
    } else {
      // Sync avatar if missing
      if (!user.avatar) {
        user.avatar = picture;
        await user.save();
      }
    }

    const token = user.generateAccessToken();
    const safeUser = await User.findById(user._id).select('-password');

    return sendAuthResponse(res, 200, safeUser, token, 'Welcome back via Google.');
  } catch (error) {
    throw new ApiError(401, 'Google authentication failed. Please try again.');
  }
});

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    throw new ApiError(400, 'Name, email, and password are required.');
  }

  const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, 'That email is already registered. Try logging in.');
  }

  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: 'user' // Always default to user during public registration
  });

  const safeUser = await User.findById(user._id).select('-password');
  const token = safeUser.generateAccessToken();

  return sendAuthResponse(res, 201, safeUser, token, 'Account created.');
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Email or password is wrong.');
  }

  const passwordOk = await user.isPasswordCorrect(password);
  if (!passwordOk) {
    throw new ApiError(401, 'Email or password is wrong.');
  }

  const token = user.generateAccessToken();
  const safeUser = await User.findById(user._id).select('-password');

  return sendAuthResponse(res, 200, safeUser, token, 'Welcome back.');
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return res.status(200).json(new ApiResponse(200, user, 'OK'));
});

export const logoutUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .clearCookie('token', cookieOptions)
    .json(new ApiResponse(200, null, 'Logged out'));
});
