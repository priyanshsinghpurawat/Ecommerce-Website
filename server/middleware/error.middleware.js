import { ApiError } from '../utils/apiError.js';

const errorHandler = (err, req, res, next) => {
  let error = err;

  // If the error is not an instance of custom ApiError, wrap it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value for field '${field}'. Please use another value.`;
    error = new ApiError(400, message);
  }

  // Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid format for field: ${err.path}`;
    error = new ApiError(400, message);
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, "Invalid token. Please log in again.");
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, "Token has expired. Please log in again.");
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
  };

  return res.status(error.statusCode).json(response);
};

export { errorHandler };
