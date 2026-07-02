import { Router } from 'express';
import { registerUser, loginUser, googleLogin, getCurrentUser, logoutUser, forgotPassword, resetPassword, refreshAccessToken, revokeAllSessions } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, googleLoginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/index.js';

const router = Router();

/**
 * @openapi
 * /api/v3/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               role:
 *                 type: string
 *                 enum: [user, seller]
 *               brandName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
router.post('/register', validate({ body: registerSchema }), registerUser);

/**
 * @openapi
 * /api/v3/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate({ body: loginSchema }), loginUser);

/**
 * @openapi
 * /api/v3/auth/google-login:
 *   post:
 *     summary: Google OAuth Login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Google Auth verification failed
 */
router.post('/google-login', validate({ body: googleLoginSchema }), googleLogin);

/**
 * @openapi
 * /api/v3/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/me', verifyJWT, getCurrentUser);

/**
 * @openapi
 * /api/v3/auth/logout:
 *   post:
 *     summary: Logout user (clear cookies)
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', logoutUser);

/**
 * @openapi
 * /api/v3/auth/forgot-password:
 *   post:
 *     summary: Send password reset link to email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset link sent if email is registered
 */
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), forgotPassword);

/**
 * @openapi
 * /api/v3/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', validate({ body: resetPasswordSchema }), resetPassword);

/**
 * @openapi
 * /api/v3/auth/refresh-token:
 *   post:
 *     summary: Refresh access token using refresh token cookie
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh-token', refreshAccessToken);

/**
 * @openapi
 * /api/v3/auth/revoke-sessions:
 *   post:
 *     summary: Revoke all refresh tokens for the user
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions revoked
 */
router.post('/revoke-sessions', verifyJWT, revokeAllSessions);

export default router;
