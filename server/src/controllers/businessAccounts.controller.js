import prisma from '../lib/prisma.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { SELLER_STATUSES } from '../lib/constants.js';
import { storeImageBufferDetailed } from '../lib/imageStorage.js';

// Verification document fields are PRIVATE (admin-only). This explicit list is
// what we strip before returning a business account to a non-admin caller.
const PRIVATE_DOC_FIELDS = [
  'verificationDocUrl', 'verificationDocPublicId', 'verificationDocLabel',
  'cnicDocUrl', 'cnicDocPublicId', 'ntnNumber',
];
function stripPrivateDocs(account) {
  if (!account) return account;
  const out = { ...account };
  for (const f of PRIVATE_DOC_FIELDS) delete out[f];
  return out;
}

/* POST /api/business-accounts  (multipart/form-data)
   Create (or update) the caller's business account WITH authenticity details:
   address, phone, and a required verification document photo (+ optional CNIC /
   NTN). Seller status starts 'not_applied'; the user applies via /apply. The
   document URLs are stored but never exposed publicly. */
export const applyForBusiness = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { businessName, businessType, businessAddress, businessPhone, ntnNumber } = req.body;
  const files = req.files || {};
  const verificationFile = files.verificationDoc?.[0];
  const cnicFile = files.cnicDoc?.[0];

  // A verification document is required to apply for a business account (beta).
  if (!verificationFile?.buffer?.length) {
    throw new ApiError(422, 'A business verification document photo is required.', { code: 'VERIFICATION_DOC_REQUIRED' });
  }

  // Upload the required verification doc (and optional CNIC) to a private folder
  // BEFORE writing the row — if an upload fails, the application is not saved.
  const verification = await storeImageBufferDetailed(verificationFile, { folder: 'business-verification' });
  const cnic = cnicFile?.buffer?.length
    ? await storeImageBufferDetailed(cnicFile, { folder: 'business-verification' })
    : null;

  const docData = {
    businessAddress,
    businessPhone,
    ntnNumber: ntnNumber || null,
    verificationDocUrl: verification.url,
    verificationDocPublicId: verification.publicId,
    verificationDocLabel: verificationFile.originalname || null,
    ...(cnic ? { cnicDocUrl: cnic.url, cnicDocPublicId: cnic.publicId } : {}),
  };

  const account = await prisma.businessAccount.upsert({
    where: { userId },
    update: { businessName, ...(businessType !== undefined ? { businessType } : {}), ...docData },
    create: { userId, businessName, businessType: businessType || null, ...docData },
  });

  // Reflect the chosen account type on the user.
  await prisma.user.update({ where: { id: userId }, data: { accountType: 'business' } });

  // Caller is the owner — safe to return their own account, minus nothing extra.
  res.status(201).json({ businessAccount: account });
});

/* POST /api/business-accounts/apply — an existing business account applies for
   Business Seller status (not_applied/rejected → pending). */
export const applyForSeller = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const account = await prisma.businessAccount.findUnique({ where: { userId } });
  if (!account) throw new ApiError(400, 'Create a business account before applying for Business Seller.');
  if (account.sellerStatus === 'approved') throw new ApiError(400, 'You are already an approved Business Seller.');
  // Verification document is mandatory for beta — can't apply without it on file.
  if (!account.verificationDocUrl) {
    throw new ApiError(422, 'Please submit your business details and a verification document before applying.', { code: 'VERIFICATION_DOC_REQUIRED' });
  }
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

/* GET /api/business-accounts/:id — owner or admin only. Verification documents
   are stripped for everyone except admins (they are admin-only). */
export const getBusinessAccount = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const account = await prisma.businessAccount.findUnique({ where: { id } });
  if (!account) throw new ApiError(404, 'Business account not found.');

  const isAdmin = req.user?.role === 'admin';
  const isOwner = req.user?.id === account.userId;
  if (!isAdmin && !isOwner) throw new ApiError(403, 'Not authorised for this account.');

  res.json({ businessAccount: isAdmin ? account : stripPrivateDocs(account) });
});

/* PATCH /api/business-accounts/:id/decision — admin sets seller status and/or
   payment. The user is businessVerified only when approved AND payment settled
   (paid or waived). No payment gateway — admin waives or marks paid for beta. */
export const decideBusinessAccount = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { sellerStatus, paymentStatus, adminNotes } = req.body;

  const existing = await prisma.businessAccount.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'Business account not found.');

  const nextSeller = sellerStatus ?? existing.sellerStatus;
  const nextPayment = paymentStatus ?? existing.paymentStatus;
  const settled = nextPayment === 'paid' || nextPayment === 'waived';
  const verified = nextSeller === 'approved' && settled;

  const [account] = await prisma.$transaction([
    prisma.businessAccount.update({
      where: { id },
      data: {
        sellerStatus: nextSeller,
        paymentStatus: nextPayment,
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
    }),
    prisma.user.update({
      where: { id: existing.userId },
      data: { businessVerified: verified },
    }),
  ]);

  res.json({ businessAccount: account, businessVerified: verified });
});
