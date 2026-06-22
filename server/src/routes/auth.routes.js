import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  requestResetSchema,
  resetPasswordSchema,
  changePasswordSchema,
  requestEmailChangeSchema,
  confirmEmailChangeSchema,
} from '../validators/schemas.js';
import * as auth from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Strict per-IP rate limit on credential + email-sending endpoints (brute force,
// credential stuffing, email bombing).
router.post('/register', authLimiter, validate(registerSchema), auth.register);
router.post('/verify-email', authLimiter, validate(verifyEmailSchema), auth.verifyEmail);
router.post('/resend-verification', authLimiter, validate(resendVerificationSchema), auth.resendVerification);
router.post('/login', authLimiter, validate(loginSchema), auth.login);
router.get('/me', requireAuth, auth.me);
router.post('/request-password-reset', authLimiter, validate(requestResetSchema), auth.requestPasswordReset);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), auth.resetPassword);
router.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  auth.changePassword,
);
router.post(
  '/request-email-change',
  requireAuth,
  validate(requestEmailChangeSchema),
  auth.requestEmailChange,
);
router.post(
  '/confirm-email-change',
  requireAuth,
  validate(confirmEmailChangeSchema),
  auth.confirmEmailChange,
);

export default router;
