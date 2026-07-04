import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler } from '../../middleware/error.middleware.js';
import { ApiError } from '../../utils/helpers.js';

describe('errorHandler middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  it('returns JSON response for ApiError', () => {
    const error = new ApiError(404, 'Not found');
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(404);
    expect(body.message).toBe('Not found');
  });

  it('wraps non-ApiError into ApiError with 500 status', () => {
    const error = new Error('Something broke');
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body.statusCode).toBe(500);
    expect(body.message).toBe('Something broke');
  });

  it('handles Mongoose duplicate key error (code 11000)', () => {
    const error = new Error('Duplicate key');
    error.code = 11000;
    error.keyValue = { email: 'test@test.com' };
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.message).toContain('email');
  });

  it('handles Mongoose CastError (invalid ObjectId)', () => {
    const error = new Error('Cast failed');
    error.name = 'CastError';
    error.path = '_id';
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.message).toContain('_id');
  });

  it('handles JsonWebTokenError', () => {
    const error = new Error('jwt malformed');
    error.name = 'JsonWebTokenError';
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    const body = res.json.mock.calls[0][0];
    expect(body.message).toContain('Invalid token');
  });

  it('handles TokenExpiredError', () => {
    const error = new Error('jwt expired');
    error.name = 'TokenExpiredError';
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    const body = res.json.mock.calls[0][0];
    expect(body.message).toContain('expired');
  });

  it('handles ValidationError from Mongoose', () => {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    error.errors = [];
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('does not include stack trace in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const error = new ApiError(400, 'Bad request');
    errorHandler(error, req, res, next);
    const body = res.json.mock.calls[0][0];
    expect(body.stack).toBeUndefined();
    process.env.NODE_ENV = originalEnv;
  });
});
