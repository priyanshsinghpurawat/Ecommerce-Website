import { Router } from 'express';
import { registerUser, loginUser, googleLogin, getCurrentUser, logoutUser } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, googleLoginSchema } from '../validators/index.js';

const router = Router();

router.post('/register', validate({ body: registerSchema }), registerUser);
router.post('/login', validate({ body: loginSchema }), loginUser);
router.post('/google-login', validate({ body: googleLoginSchema }), googleLogin);
router.get('/me', verifyJWT, getCurrentUser);
router.post('/logout', verifyJWT, logoutUser);

export default router;
