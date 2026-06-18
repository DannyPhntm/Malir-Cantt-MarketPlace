import prisma from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { CATEGORIES } from '../lib/constants.js';

/* GET /api/stats/public — public marketplace stats for the homepage / footer.
   Exposes only safe aggregates (no moderation/pending counts). */
export const getPublicStats = asyncHandler(async (req, res) => {
  const [users, activeListings, verifiedBusinesses, grouped] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count({ where: { status: 'approved' } }),
    prisma.user.count({ where: { businessVerified: true } }),
    prisma.listing.groupBy({
      by: ['category'],
      where: { status: 'approved' },
      _count: { _all: true },
    }),
  ]);

  // Start every category at 0 so the UI always has a full set.
  const categoryCounts = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  for (const g of grouped) categoryCounts[g.category] = g._count._all;

  res.json({
    stats: {
      activeListings,
      users,
      verifiedBusinesses,
      categories: CATEGORIES.length,
      categoryCounts,
    },
  });
});

/* GET /api/stats — aggregate counts for the admin dashboard. */
export const getStats = asyncHandler(async (req, res) => {
  const [
    users,
    listingsTotal,
    pending,
    approved,
    rejected,
    sold,
    hidden,
    featured,
    featuredPending,
    businessTotal,
    businessPending,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: 'pending' } }),
    prisma.listing.count({ where: { status: 'approved' } }),
    prisma.listing.count({ where: { status: 'rejected' } }),
    prisma.listing.count({ where: { status: 'sold' } }),
    prisma.listing.count({ where: { status: 'hidden' } }),
    prisma.listing.count({ where: { featuredActive: true } }),
    // Featured requested but not yet activated by an admin.
    prisma.listing.count({ where: { featuredRequested: true, featuredActive: false } }),
    prisma.businessAccount.count(),
    prisma.businessAccount.count({ where: { approved: false } }),
  ]);

  res.json({
    stats: {
      users,
      listings: { total: listingsTotal, pending, approved, rejected, sold, hidden, featured, featuredPending },
      business: { total: businessTotal, pending: businessPending },
    },
  });
});
