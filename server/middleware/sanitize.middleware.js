/**
 * Middleware to recursively sanitize request body, query parameters, and route parameters
 * by stripping keys starting with '$' to prevent MongoDB query injection attacks.
 */
export const sanitizeRequest = (req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (key.startsWith('$')) {
          delete obj[key];
        } else if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitize(obj[key]);
        }
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};
