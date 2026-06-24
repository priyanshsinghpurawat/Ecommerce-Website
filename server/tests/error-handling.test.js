import { describe, it, beforeAll as before, afterAll as after } from 'vitest';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../middleware/error.middleware.js';
import { 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError, 
  ConflictError, 
  ApiError 
} from '../utils/helpers.js';

describe('Custom Error Subclasses & Middleware Handler', () => {
  let mockApp;

  before(() => {
    mockApp = express();
    mockApp.use(express.json());

    // Setup routes to trigger specific error types
    mockApp.get('/test-validation', (req, res, next) => {
      next(new ValidationError('Name is required', [{ field: 'name', message: 'Name is required' }]));
    });

    mockApp.get('/test-not-found', (req, res, next) => {
      next(new NotFoundError('Product not found'));
    });

    mockApp.get('/test-unauthorized', (req, res, next) => {
      next(new UnauthorizedError('Please login first'));
    });

    mockApp.get('/test-forbidden', (req, res, next) => {
      next(new ForbiddenError('Only sellers allowed'));
    });

    mockApp.get('/test-conflict', (req, res, next) => {
      next(new ConflictError('Product code already exists'));
    });

    mockApp.get('/test-raw-error', (req, res, next) => {
      next(new Error('Unexpected runtime crash'));
    });

    // Mount global error handler
    mockApp.use(errorHandler);
  });

  it('should format ValidationError as a 400 response with error details', async () => {
    const res = await request(mockApp).get('/test-validation').expect(400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.statusCode, 400);
    assert.equal(res.body.message, 'Name is required');
    assert.ok(Array.isArray(res.body.errors));
    assert.equal(res.body.errors[0].field, 'name');
  });

  it('should format NotFoundError as a 404 response', async () => {
    const res = await request(mockApp).get('/test-not-found').expect(404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.statusCode, 404);
    assert.equal(res.body.message, 'Product not found');
  });

  it('should format UnauthorizedError as a 401 response', async () => {
    const res = await request(mockApp).get('/test-unauthorized').expect(401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.statusCode, 401);
    assert.equal(res.body.message, 'Please login first');
  });

  it('should format ForbiddenError as a 403 response', async () => {
    const res = await request(mockApp).get('/test-forbidden').expect(403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.statusCode, 403);
    assert.equal(res.body.message, 'Only sellers allowed');
  });

  it('should format ConflictError as a 409 response', async () => {
    const res = await request(mockApp).get('/test-conflict').expect(409);
    assert.equal(res.body.success, false);
    assert.equal(res.body.statusCode, 409);
    assert.equal(res.body.message, 'Product code already exists');
  });

  it('should wrap standard Error objects into 500 status Internal Server Errors', async () => {
    const res = await request(mockApp).get('/test-raw-error').expect(500);
    assert.equal(res.body.success, false);
    assert.equal(res.body.statusCode, 500);
    assert.equal(res.body.message, 'Unexpected runtime crash');
  });
});
