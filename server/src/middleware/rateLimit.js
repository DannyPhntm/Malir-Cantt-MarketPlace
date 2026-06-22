import rateLimit from 'express-rate-limit';

// Shared options — emit standard RateLimit headers, no legacy headers, and a
// friendly JSON error matching the app's { error } shape.
const base = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
};

// Generous global limiter. Protects against scripted abuse without affecting
// normal browsing — a real session makes far fewer requests than this.
export const globalLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000,
  message: { error: 'Too many requests. Please slow down and try again shortly.' },
});

// Strict limiter for auth + email endpoints (login, register, verify-email,
// resend-verification, request/reset password). Stops brute force, credential
// stuffing, and email bombing.
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});
