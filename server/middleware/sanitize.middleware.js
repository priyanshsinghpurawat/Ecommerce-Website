import mongoSanitize from 'express-mongo-sanitize';

/**
 * Middleware to sanitize request body, query parameters, and route parameters
 * to prevent MongoDB query injection attacks.
 *
 * Uses express-mongo-sanitize which handles both '$' prefixed keys and
 * dot-notation keys (e.g. "user.role", "address.zipCode.$ne").
 */
export const sanitizeRequest = mongoSanitize({
  allowDots: false,
  replaceWith: '_',
  onSanitize: () => {
    // Silent — do not log in production to avoid noise
  }
});
