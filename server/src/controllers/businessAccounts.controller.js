import prisma from '../lib/prisma.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { SELLER_STATUSES } from '../lib/constants.js';

/* POST /api/business-accounts — create (or rename) a business account.
   Seller status starts 'not_applied'; the user applies separately via /apply. */
export const applyForBusiness = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { businessName, businessType } = req.body;

  const account = await prisma.businessAccount.upsert({
    where: { userId },
    update: { businessName, ...(businessType !== undefined ? { businessType } : {}) },
    create: { userId, businessName, businessType: businessType || null },
  });

  // Reflect the chosen account type on the user.
  await prisma.user.update({ where: { id: userId }, data: { accountType: 'business' } });

  res.status(201).json({ businessAccount: account });
});

/* POST /api/business-accounts/apply — an existing business account applies for
   Business Seller status (not_applied/rejected → pending). */
export const applyForSeller = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const account = await prisma.businessAccount.findUnique({ where: { userId } });
  if (!account) throw new ApiError(400, 'Create a business account before applying for Business Seller.');
  if (account.sellerStatus === 'approved') throw new ApiError(400, 'You are already an approved Business Seller.');
  const updated = await prisma.businessAccount.update({
    where: { userId },
    data: { sellerStatus: 'pending' },
  });
  res.json({ businessAccount: updated });
});

/* GET /api/business-accounts?status=pending|approved|… — admin queue. */
export const listBusinessAccounts = asyncHandler(async (req, res) => {
  const where = {};
  if (SELLER_STATUSES.includes(req.query.status)) where.sellerStatus = req.query.status;

  const businessAccounts = await prisma.businessAccount.findMany({
    where,
    orderBy: { id: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true, residentLocation: true, createdAt: true },
      },
    },
  });
  res.json({ businessAccounts });
});

/* GET /api/business-accounts/:id */
export const getBusinessAccount = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const account = await prisma.businessAccount.findUnique({ where: { id }, include: { user: false } });
  if (!account) throw new ApiError(404, 'Business account not found.');
  res.json({ businessAccount: account });
});

/* PATCH /api/business-accounts/:id/decision — admin sets seller status and/or
   payment. The user is businessVerified only when approved AND payment settled
   (paid or waived). No payment gateway — admin waives or marks paid for beta. */
export const decideBusinessAccount = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { sellerStatus, paymentStatus } = req.body;

  const existing = await prisma.businessAccount.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'Business account not found.');

  const nextSeller = sellerStatus ?? existing.sellerStatus;
  const nextPayment = paymentStatus ?? existing.paymentStatus;
  const settled = nextPayment === 'paid' || nextPayment === 'waived';
  const verified = nextSeller === 'approved' && settled;

  const [account] = await prisma.$transaction([
    prisma.businessAccount.update({
      where: { id },
      data: { sellerStatus: nextSeller, paymentStatus: nextPayment },
    }),
    prisma.user.update({
      where: { id: existing.userId },
      data: { businessVerified: verified },
    }),
  ]);

  res.json({ businessAccount: account, businessVerified: verified });
});
