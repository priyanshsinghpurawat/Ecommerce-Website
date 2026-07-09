import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../app.js';
import { User } from '../../models/user.model.js';

let mongod;

beforeAll(async () => {
  // Use existing connection or start a new memory database connection
  if (mongoose.connection.readyState === 0) {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  }
});

afterAll(async () => {
  if (mongod) {
    await mongoose.disconnect();
    await mongod.stop();
  }
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('Auth Controller Integration Tests', () => {
  const validUser = {
    name: 'John Doe',
    email: 'johndoe@example.com',
    password: 'Password@1234',
  };

  it('should register a new user successfully', async () => {
    const res = await request(app).post('/api/v3/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.role).toBe('user');
  });

  it('should reject duplicate email registration', async () => {
    // Create the first user
    await request(app).post('/api/v3/auth/register').send(validUser);

    // Try creating duplicate
    const res = await request(app).post('/api/v3/auth/register').send(validUser);

    expect(res.status).toBe(409); // Conflict
    expect(res.body.success).toBe(false);
  });

  it('should login a registered user successfully', async () => {
    // Register the user
    await request(app).post('/api/v3/auth/register').send(validUser);

    // Login
    const res = await request(app).post('/api/v3/auth/login').send({
      email: validUser.email,
      password: validUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should reject login with incorrect password', async () => {
    await request(app).post('/api/v3/auth/register').send(validUser);

    const res = await request(app).post('/api/v3/auth/login').send({
      email: validUser.email,
      password: 'WrongPassword@999',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should block login if user is deactivated', async () => {
    // Register
    await request(app).post('/api/v3/auth/register').send(validUser);

    // Deactivate user in database
    await User.findOneAndUpdate({ email: validUser.email }, { isActive: false });

    // Try login
    const res = await request(app).post('/api/v3/auth/login').send({
      email: validUser.email,
      password: validUser.password,
    });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('deactivated');
  });
});
