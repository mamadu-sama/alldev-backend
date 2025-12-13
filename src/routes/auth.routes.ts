import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { validate } from '@/middleware/validate.middleware';
import { authenticate } from '@/middleware/auth.middleware';
import { authRateLimiter } from '@/middleware/rateLimiter.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
} from '@/schemas/auth.schema';

const router = Router();

// Public routes with rate limiting
router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  AuthController.register
);

router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  AuthController.login
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  AuthController.refreshToken
);

router.post(
  '/logout',
  validate(refreshTokenSchema),
  AuthController.logout
);

router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  AuthController.forgotPassword
);

router.post(
  '/reset-password',
  authRateLimiter,
  validate(resetPasswordSchema),
  AuthController.resetPassword
);

router.post(
  '/verify-email',
  validate(verifyEmailSchema),
  AuthController.verifyEmail
);

// Protected route
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  AuthController.changePassword
);

export default router;

