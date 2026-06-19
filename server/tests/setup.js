process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-must-be-at-least-32-chars-long';
process.env.JWT_EXPIRY = '1d';
process.env.MONGODB_URI = 'mongodb://test';
process.env.CORS_ORIGIN = 'http://localhost:3000';
