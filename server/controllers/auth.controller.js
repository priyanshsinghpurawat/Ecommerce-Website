import crypto from 'crypto';
import { asyncHandler, ApiError, ApiResponse, buildSafeUser } from '../utils/helpers.js';
import { User } from '../models/user.model.js';
import { OAuth2Client } from 'google-auth-library';
import { ENV } from '../config/env.js';

const client = new OAuth2Client(ENV.GOOGLE_CLIENT_ID);

const cookieOptions = {
  httpOnly: true,
  secure: ENV.NODE_ENV === 'production',
  sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000
};

const sendAuthResponse = (res, statusCode, user, token, message) => {
  return res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json(new ApiResponse(statusCode, { user }, message));
};



export const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: ENV.GOOGLE_CLIENT_ID
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
        role: 'user'
      });
    } else {
      if (!user.avatar) {
        user.avatar = picture;
        await user.save();
      }
    }

    const token = user.generateAccessToken();

    return sendAuthResponse(res, 200, buildSafeUser(user), token, 'Welcome back via Google.');
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
    role: 'user'
  });

  const token = user.generateAccessToken();

  return sendAuthResponse(res, 201, buildSafeUser(user), token, 'Account created.');
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

  const token = user.generateAccessToken();

  return sendAuthResponse(res, 200, buildSafeUser(user), token, 'Welcome back.');
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const safeUser = buildSafeUser(req.user);
  return res.status(200).json(new ApiResponse(200, safeUser, 'OK'));
});

export const logoutUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .clearCookie('token', cookieOptions)
    .json(new ApiResponse(200, null, 'Logged out'));
});
