/**
 * verifyJWT — reads Bearer token, loads req.user.
 * authorizeRoles('admin') — blocks users without the right role.
 */
/** WHY: Verifies JWT tokens and checks if a user has Admin/Seller permissions. */
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError, asyncHandler } from '../utils/helpers.js';
import { ENV } from '../config/env.js';

// Verify JWT token from header or cookie
export const verifyJWT = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request. Access token is missing.");
  }

  try {
    const decodedToken = jwt.verify(token, ENV.JWT_SECRET);
    const user = await User.findById(decodedToken._id).select("-password");

    if (!user) {
      throw new ApiError(401, "Invalid Access Token. User not found.");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});

// Authorize roles (RBAC)
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized request. Please log in."));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Access denied. Role '${req.user.role}' is not authorized to access this resource.`));
    }
    next();
  };
};
