import prisma from '../lib/prisma.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { SELLER_STATUSES } from '../lib/constants.js';
import { storeImageBufferDetailed, signedDocUrl, destroyDocAsset } from '../lib/imageStorage.js';

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

// Admin view: swap authenticated-type document URLs for signed delivery URLs
// (the raw stored URL of an authenticated asset is not publicly fetchable).
function withSignedDocs(account) {
  if (!account) return account;
  return {
    ...account,
    verificationDocUrl: signedDocUrl(account.verificationDocUrl, account.verificationDocPublicId),
    cnicDocUrl: signedDocUrl(account.cnicDocUrl, account.cnicDocPublicId),
  };
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

  // Upload the required verification doc (and optional CNIC) BEFORE writing the
  // row — if an upload fails, the application is not saved. Uploaded with the
  // `authenticated` delivery type: identity documents must not be fetchable by
  // anyone who obtains the URL — only admins see them, via signed URLs.
  const verification = await storeImageBufferDetailed(verificationFile, {
    folder: 'business-verification',
    authenticated: true,
  });
  const cnic = cnicFile?.buffer?.length
    ? await storeImageBufferDetailed(cnicFile, { folder: 'business-verification', authenticated: true })
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

  // Re-applications replace the stored documents — remember the old assets so
  // they can be removed from Cloudinary after a successful save (no orphaned
  // identity documents left behind).
  const previous = await prisma.businessAccount.findUnique({
    where: { userId },
    select: { verificationDocPublicId: true, cnicDocPublicId: true },
  });

  // Account row + user accountType change atomically.
  const [account] = await prisma.$transaction([
    prisma.businessAccount.upsert({
      where: { userId },
      update: { businessName, ...(businessType !== undefined ? { businessType } : {}), ...docData },
      create: { userId, businessName, businessType: businessType || null, ...docData },
    }),
    prisma.user.update({ where: { id: userId }, data: { accountType: 'business' } }),
  ]);

  // Best-effort cleanup of the replaced document assets.
  if (previous?.verificationDocPublicId && previous.verificationDocPublicId !== verification.publicId) {
    await destroyDocAsset(previous.verificationDocPublicId);
  }
  if (cnic && previous?.cnicDocPublicId && previous.cnicDocPublicId !== cnic.publicId) {
    await destroyDocAsset(previous.cnicDocPublicId);
  }

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
  // Admin-only route — document URLs are signed for authenticated-type assets.
  res.json({ businessAccounts: businessAccounts.map(withSignedDocs) });
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

  res.json({ businessAccount: isAdmin ? withSignedDocs(account) : stripPrivateDocs(account) });
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
  const wasVerified =
    existing.sellerStatus === 'approved' &&
    (existing.paymentStatus === 'paid' || existing.paymentStatus === 'waived');

  const ops = [
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
  ];

  // Revoking an approved business also takes their public business presence
  // offline: the shop and any live business listings are hidden (reversible —
  // nothing is deleted; featured flags are cleared so slots free up). Without
  // this, a revoked business kept its shop and listings live indefinitely.
  if (wasVerified && !verified) {
    ops.push(
      prisma.shop.updateMany({
        where: { userId: existing.userId, status: { in: ['pending', 'approved'] } },
        data: { status: 'hidden' },
      }),
      prisma.listing.updateMany({
        where: { userId: existing.userId, postingType: 'business', status: { in: ['pending', 'approved'] } },
        data: { status: 'hidden', featuredActive: false, featuredUntil: null },
      }),
    );
  }

  const [account] = await prisma.$transaction(ops);

  res.json({ businessAccount: account, businessVerified: verified });
});
