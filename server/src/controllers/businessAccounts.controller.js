import prisma from '../lib/prisma.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

/* POST /api/business-accounts — apply (or re-apply) for a business account.
   Stays unapproved until an admin decision (never auto-approved). */
export const applyForBusiness = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { businessName } = req.body;

  const account = await prisma.businessAccount.upsert({
    where: { userId },
    update: { businessName, approved: false },
    create: { userId, businessName, approved: false },
  });

  // Reflect the chosen account type on the user.
  await prisma.user.update({ where: { id: userId }, data: { accountType: 'business' } });

  res.status(201).json({ businessAccount: account });
});

/* GET /api/business-accounts?approved=true|false — admin queue. */
export const listBusinessAccounts = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.approved === 'true') where.approved = true;
  if (req.query.approved === 'false') where.approved = false;

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

/* PATCH /api/business-accounts/:id/decision — admin approve/reject + payment.
   Approval requires payment to be settled (paid OR not_required) to mark the
   user businessVerified — mirrors isPremiumActive in the frontend. */
export const decideBusinessAccount = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { approved, paymentStatus } = req.body;

  const existing = await prisma.businessAccount.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'Business account not found.');

  const nextPayment = paymentStatus ?? existing.paymentStatus;
  const settled = nextPayment === 'paid' || nextPayment === 'not_required';
  const verified = approved && settled;

  const [account] = await prisma.$transaction([
    prisma.businessAccount.update({
      where: { id },
      data: { approved, paymentStatus: nextPayment },
    }),
    prisma.user.update({
      where: { id: existing.userId },
      data: { businessVerified: verified },
    }),
  ]);

  res.json({ businessAccount: account, businessVerified: verified });
});
