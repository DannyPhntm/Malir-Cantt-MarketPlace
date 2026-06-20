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

const router = Router();

router.post('/register', validate(registerSchema), auth.register);
router.post('/verify-email', validate(verifyEmailSchema), auth.verifyEmail);
router.post('/resend-verification', validate(resendVerificationSchema), auth.resendVerification);
router.post('/login', validate(loginSchema), auth.login);
router.get('/me', requireAuth, auth.me);
router.post('/request-password-reset', validate(requestResetSchema), auth.requestPasswordReset);
router.post('/reset-password', validate(resetPasswordSchema), auth.resetPassword);
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
