import prisma from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';

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
  res.json({ listings: rows.map((r) => r.listing) });
});

/* POST /api/saved { listingId } — idempotent save. */
export const addSaved = asyncHandler(async (req, res) => {
  const { listingId } = req.body;
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
