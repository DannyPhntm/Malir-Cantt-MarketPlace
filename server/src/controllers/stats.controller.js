import prisma from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';

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
