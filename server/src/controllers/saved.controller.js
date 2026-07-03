import prisma from '../lib/prisma.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

// Statuses a non-owner is allowed to see. Saving is limited to these so the
// saved-listings API can't be used to probe or read private (pending/hidden/
// rejected) listings that the detail route deliberately 404s.
const PUBLIC_STATUSES = ['approved', 'sold'];

const withListing = {
  listing: {
    include: {
      images: { orderBy: { displayOrder: 'asc' } },
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          accountType: true,
          businessVerified: true,
          residentLocation: true,
          createdAt: true,
        },
      },
    },
  },
};

/* GET /api/saved — the authenticated user's saved listings (full listing data). */
export const listSaved = asyncHandler(async (req, res) => {
  const rows = await prisma.savedListing.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: withListing,
  });
  // A listing may go private AFTER being saved — filter those out here (unless
  // the saver owns them) instead of leaking their content with full seller data.
  const listings = rows
    .map((r) => r.listing)
    .filter((l) => l && (PUBLIC_STATUSES.includes(l.status) || l.userId === req.user.id));
  res.json({ listings });
});

/* POST /api/saved { listingId } — idempotent save. */
export const addSaved = asyncHandler(async (req, res) => {
  const { listingId } = req.body;
  // Only public listings can be saved (404 mirrors the detail route so private
  // listings' existence isn't confirmed either).
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { status: true } });
  if (!listing || !PUBLIC_STATUSES.includes(listing.status)) {
    throw new ApiError(404, 'Listing not found.');
  }
  await prisma.savedListing.upsert({
    where: { userId_listingId: { userId: req.user.id, listingId } },
    update: {},
    create: { userId: req.user.id, listingId },
  });
  res.status(201).json({ saved: true });
});

/* DELETE /api/saved/:listingId — idempotent remove. */
export const removeSaved = asyncHandler(async (req, res) => {
  const listingId = Number(req.params.listingId);
  await prisma.savedListing.deleteMany({ where: { userId: req.user.id, listingId } });
  res.status(204).end();
});
