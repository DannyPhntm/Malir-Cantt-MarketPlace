import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { generateCode, codeExpiry, isExpired } from '../lib/codes.js';
import { signToken } from '../lib/jwt.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendEmailChangeEmail,
} from '../lib/emailer.js';

// Strip the password hash before returning a user to the client.
function publicUser(user) {
  if (!user) return user;
  const { passwordHash, ...rest } = user;
  return rest;
}

/* POST /api/auth/register
   Creates a user (+ business account row when accountType==='business'),
   then issues an email verification code and emails it to the user. The code is
   never returned in the response. */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, accountType, residentLocation, canttPassNumber, businessName } =
    req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'An account with that email already exists.');

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      phone,
      accountType,
      residentLocation,
      canttPassNumber: canttPassNumber || null,
      // Business accounts start unverified + pending approval.
      businessAccount:
        accountType === 'business'
          ? { create: { businessName: businessName || name, approved: false } }
          : undefined,
    },
    include: { businessAccount: true },
  });

  const code = generateCode();
  await prisma.emailVerificationCode.create({
    data: { email, code, expiresAt: codeExpiry() },
  });
  await sendVerificationEmail({ to: email, code, name });

  res.status(201).json({ user: publicUser(user) });
});

/* POST /api/auth/verify-email */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  const record = await prisma.emailVerificationCode.findFirst({
    where: { email, code, verified: false },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw new ApiError(400, 'Invalid verification code.');
  if (isExpired(record.expiresAt)) throw new ApiError(400, 'Verification code has expired.');

  await prisma.$transaction([
    prisma.emailVerificationCode.update({ where: { id: record.id }, data: { verified: true } }),
    prisma.user.update({ where: { email }, data: { emailVerified: true } }),
  ]);

  const user = await prisma.user.findUnique({ where: { email }, include: { businessAccount: true } });
  // Email verified → sign the user in.
  res.json({ verified: true, user: publicUser(user), token: signToken(user) });
});

/* GET /api/auth/me — current user from the bearer token (session rehydration). */
export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { businessAccount: true },
  });
  if (!user) throw new ApiError(404, 'User not found.');
  res.json({ user: publicUser(user) });
});

/* POST /api/auth/resend-verification — re-issue an email verification code. */
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, 'No account found for that email.');
  if (user.emailVerified) throw new ApiError(400, 'Email is already verified.');

  const code = generateCode();
  await prisma.emailVerificationCode.create({ data: { email, code, expiresAt: codeExpiry() } });
  await sendVerificationEmail({ to: email, code, name: user.name });

  res.json({ resent: true });
});

/* POST /api/auth/login — verifies credentials (no JWT yet; see README). */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email }, include: { businessAccount: true } });
  if (!user) throw new ApiError(401, 'Invalid email or password.');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new ApiError(401, 'Invalid email or password.');

  res.json({ user: publicUser(user), token: signToken(user) });
});

/* POST /api/auth/request-password-reset */
export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond 200 to avoid leaking which emails exist.
  if (!user) return res.json({ requested: true });

  const code = generateCode();
  await prisma.passwordResetCode.create({ data: { email, code, expiresAt: codeExpiry() } });
  await sendPasswordResetEmail({ to: email, code });

  res.json({ requested: true });
});

/* POST /api/auth/reset-password */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, password } = req.body;

  const record = await prisma.passwordResetCode.findFirst({
    where: { email, code, used: false },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw new ApiError(400, 'Invalid reset code.');
  if (isExpired(record.expiresAt)) throw new ApiError(400, 'Reset code has expired.');

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.passwordResetCode.update({ where: { id: record.id }, data: { used: true } }),
    prisma.user.update({ where: { email }, data: { passwordHash } }),
  ]);

  res.json({ reset: true });
});

/* POST /api/auth/request-email-change (auth)
   Sends a verification code to the NEW address. The change is only applied once
   the user proves control of that address via /confirm-email-change. */
export const requestEmailChange = asyncHandler(async (req, res) => {
  const { newEmail } = req.body;

  const current = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!current) throw new ApiError(404, 'User not found.');
  if (current.email === newEmail) {
    throw new ApiError(400, 'That is already your email address.');
  }

  const taken = await prisma.user.findUnique({ where: { email: newEmail } });
  if (taken) throw new ApiError(409, 'An account with that email already exists.');

  const code = generateCode();
  // The code is keyed to the NEW email so confirmation proves control of it.
  await prisma.emailVerificationCode.create({
    data: { email: newEmail, code, expiresAt: codeExpiry() },
  });
  await sendEmailChangeEmail({ to: newEmail, code });

  res.json({ requested: true });
});

/* POST /api/auth/confirm-email-change (auth)
   Validates the code sent to the new address, then swaps the user's email and
   marks it verified. Single-use code (reuse prevented via the `verified` flag). */
export const confirmEmailChange = asyncHandler(async (req, res) => {
  const { newEmail, code } = req.body;

  const taken = await prisma.user.findFirst({
    where: { email: newEmail, NOT: { id: req.user.id } },
  });
  if (taken) throw new ApiError(409, 'An account with that email already exists.');

  const record = await prisma.emailVerificationCode.findFirst({
    where: { email: newEmail, code, verified: false },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw new ApiError(400, 'Invalid verification code.');
  if (isExpired(record.expiresAt)) throw new ApiError(400, 'Verification code has expired.');

  await prisma.$transaction([
    prisma.emailVerificationCode.update({ where: { id: record.id }, data: { verified: true } }),
    prisma.user.update({
      where: { id: req.user.id },
      data: { email: newEmail, emailVerified: true },
    }),
  ]);

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { businessAccount: true },
  });
  res.json({ changed: true, user: publicUser(user) });
});
