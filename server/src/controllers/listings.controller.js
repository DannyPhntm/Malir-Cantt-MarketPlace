import prisma from '../lib/prisma.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import {
  OWNER_SETTABLE_STATUSES,
  BUSINESS_ONLY_CATEGORIES,
  IMAGE_OPTIONAL_CATEGORIES,
  MIN_IMAGES,
  MAX_IMAGES,
  MAX_FEATURED_PER_BUSINESS,
} from '../lib/constants.js';

const withImages = { images: { orderBy: { displayOrder: 'asc' } } };

// Fields exposed about the listing owner (the "seller") to the public read
// endpoints. Phone is included because the marketplace's core action is letting
// a buyer contact the seller; tighten this when private messaging lands.
const sellerSelect = {
  id: true,
  name: true,
  phone: true,
  accountType: true,
  businessVerified: true,
  residentLocation: true,
  createdAt: true,
};

/* GET /api/listings?category=&status=&userId=&featured=&featuredRequested= */
export const listListings = asyncHandler(async (req, res) => {
  const { category, subcategory, postingType, status, userId, featured, featuredRequested } = req.query;
  const where = {};
  if (category) where.category = category;
  if (subcategory) where.subcategory = subcategory;
  if (postingType) where.postingType = postingType;
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (featured !== undefined) where.featuredActive = featured;
  if (featuredRequested !== undefined) where.featuredRequested = featuredRequested;

  const listings = await prisma.listing.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { ...withImages, user: { select: sellerSelect } },
  });
  res.json({ listings });
});

/* GET /api/listings/mine — the authenticated user's listings, all statuses. */
export const listMine = asyncHandler(async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: { ...withImages, user: { select: sellerSelect } },
  });
  res.json({ listings });
});

/* GET /api/listings/:id */
export const getListing = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { ...withImages, user: { select: sellerSelect } },
  });
  if (!listing) throw new ApiError(404, 'Listing not found.');

  // Private statuses are only visible to the owner or an admin. Return 404 (not
  // 403) for everyone else so the listing's existence isn't revealed.
  const PRIVATE = ['pending', 'hidden', 'rejected'];
  if (PRIVATE.includes(listing.status)) {
    const isOwner = req.user && req.user.id === listing.userId;
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isOwner && !isAdmin) throw new ApiError(404, 'Listing not found.');
  }

  res.json({ listing });
});

/* POST /api/listings
   Standard listings go live as 'pending'; featured is never auto-activated
   (admin flips featuredActive via the status endpoint — mirrors the frontend). */
export const createListing = asyncHandler(async (req, res) => {
  // Owner comes from the authenticated token, never the request body.
  const userId = req.user.id;
  const { title, description, category, subcategory, price, featuredRequested, details, images } = req.body;

  // Posting type: commercial categories (food/services) are always business;
  // otherwise the seller's choice (default personal).
  const forcedBusiness = BUSINESS_ONLY_CATEGORIES.includes(category);
  const postingType = forcedBusiness ? 'business' : (req.body.postingType || 'personal');

  // Business listings require an active Business Seller (approved + settled).
  if (postingType === 'business') {
    const account = await prisma.businessAccount.findUnique({ where: { userId } });
    const settled = account && (account.paymentStatus === 'paid' || account.paymentStatus === 'waived');
    const active = account && account.sellerStatus === 'approved' && settled;
    if (!active) {
      throw new ApiError(403, 'Business selling requires an approved Business Seller account. Apply for Business Seller status to post commercial listings.');
    }
  }

  // Drop empty values, then store the attribute map as JSON.
  const cleanedDetails = Object.fromEntries(
    Object.entries(details || {}).filter(([, v]) => v != null && String(v).trim() !== ''),
  );

  const listing = await prisma.listing.create({
    data: {
      userId,
      title,
      description,
      category,
      subcategory: subcategory || null,
      postingType,
      price,
      featuredRequested,
      featuredActive: false,
      status: 'pending',
      details: Object.keys(cleanedDetails).length ? JSON.stringify(cleanedDetails) : null,
      images: {
        create: images.map((img, i) => ({
          imageUrl: img.imageUrl,
          displayOrder: img.displayOrder ?? i,
        })),
      },
    },
    include: withImages,
  });

  res.status(201).json({ listing });
});

// Ensure the authenticated user owns the listing (or is an admin).
async function assertListingOwner(id, reqUser) {
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'Listing not found.');
  if (existing.userId !== reqUser.id && reqUser.role !== 'admin') {
    throw new ApiError(403, 'You can only modify your own listings.');
  }
  return existing;
}

/* PATCH /api/listings/:id — owner (or admin) edits.
   Handles the full edit form: title/description/price/featuredRequested, the
   category-specific `details` map, the image set (add/remove/reorder), and
   lifecycle status. Category is intentionally NOT editable here. */
export const updateListing = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const existing = await assertListingOwner(id, req.user);
  const { status, details, images, ...rest } = req.body;

  // Status transitions for a non-admin owner: lifecycle moves from a live state
  // (approved/sold/hidden), plus resubmitting a rejected listing (→ pending).
  if (status && req.user.role !== 'admin') {
    const ownerOk =
      OWNER_SETTABLE_STATUSES.includes(existing.status) ||
      (existing.status === 'rejected' && status === 'pending');
    if (!ownerOk) {
      throw new ApiError(400, 'This listing is awaiting review and cannot change status yet.');
    }
  }

  const data = { ...rest };
  if (status !== undefined) data.status = status;

  // Category-specific attributes — clean empty values, store as JSON (or null).
  if (details !== undefined) {
    const cleaned = Object.fromEntries(
      Object.entries(details || {}).filter(([, v]) => v != null && String(v).trim() !== ''),
    );
    data.details = Object.keys(cleaned).length ? JSON.stringify(cleaned) : null;
  }

  // Image set — replace wholesale (covers add / remove / reorder). The min-count
  // rule depends on the (unchangeable) category, so it's enforced here.
  if (images !== undefined) {
    const optional = IMAGE_OPTIONAL_CATEGORIES.includes(existing.category);
    if (!optional && images.length < MIN_IMAGES) {
      throw new ApiError(422, `At least ${MIN_IMAGES} image is required for ${existing.category} listings.`);
    }
    if (images.length > MAX_IMAGES) {
      throw new ApiError(422, `A listing can have at most ${MAX_IMAGES} images.`);
    }
    data.images = {
      deleteMany: {},
      create: images.map((img, i) => ({ imageUrl: img.imageUrl, displayOrder: img.displayOrder ?? i })),
    };
  }

  const listing = await prisma.listing.update({ where: { id }, data, include: withImages });
  res.json({ listing });
});

/* PATCH /api/listings/:id/status — admin moderation + featured control.
   Accepts any subset of { status, featuredActive, featuredRequested } so the
   admin panel can approve/reject/hide/restore a listing AND activate or clear a
   featured request independently (no payment gateway — admin-controlled). */
export const setListingStatus = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { status, featuredActive, featuredRequested } = req.body;
  const data = {};
  if (status !== undefined) data.status = status;
  if (featuredActive !== undefined) data.featuredActive = featuredActive;
  if (featuredRequested !== undefined) data.featuredRequested = featuredRequested;

  // Featured cap: a business may have at most MAX_FEATURED_PER_BUSINESS active
  // featured listings at once. Only check when newly activating featured.
  if (featuredActive === true) {
    const target = await prisma.listing.findUnique({
      where: { id }, select: { userId: true, featuredActive: true },
    });
    if (target && !target.featuredActive) {
      const count = await prisma.listing.count({
        where: { userId: target.userId, featuredActive: true },
      });
      if (count >= MAX_FEATURED_PER_BUSINESS) {
        throw new ApiError(409, `This business already has ${MAX_FEATURED_PER_BUSINESS} featured listings. Unfeature one first.`);
      }
    }
  }

  const listing = await prisma.listing.update({ where: { id }, data, include: withImages });
  res.json({ listing });
});

/* DELETE /api/listings/:id — cascades to images. Owner or admin only. */
export const deleteListing = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await assertListingOwner(id, req.user);
  await prisma.listing.delete({ where: { id } });
  res.status(204).end();
});
