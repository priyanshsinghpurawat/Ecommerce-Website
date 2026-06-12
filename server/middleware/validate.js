/**
 * Generic Zod validator. Usage:
 *   router.post('/', validate({ body: productCreateSchema }), handler)
 */
import { ApiError } from '../utils/helpers.js';

const formatZodError = (err) => {
  const issues = err.issues || err.errors || [];
  return issues.map((i) => `${(i.path || []).join('.') || 'body'}: ${i.message}`).join('; ');
};

export const validate = (schemas = {}) => (req, _res, next) => {
  try {
    if (schemas.body) {
      const r = schemas.body.safeParse(req.body);
      if (!r.success) return next(new ApiError(400, formatZodError(r.error)));
      req.body = r.data;
    }
    if (schemas.params) {
      const r = schemas.params.safeParse(req.params);
      if (!r.success) return next(new ApiError(400, formatZodError(r.error)));
      req.params = r.data;
    }
    if (schemas.query) {
      const r = schemas.query.safeParse(req.query);
      if (!r.success) return next(new ApiError(400, formatZodError(r.error)));
      // do not reassign req.query (Express 5 getter)
      Object.assign(req.query, r.data);
    }
    next();
  } catch (e) {
    next(new ApiError(400, e.message || 'Invalid request'));
  }
};
