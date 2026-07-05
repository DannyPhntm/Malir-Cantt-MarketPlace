import prisma from '../lib/prisma.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { storeImageBuffer, storeImageBuffers } from '../lib/imageStorage.js';
import {
  isValidSubcategory,
  OWNER_SETTABLE_STATUSES,
  BUSINESS_ONLY_CATEGORIES,
  IMAGE_OPTIONAL_CATEGORIES,
  ACTIVE_LISTING_STATUSES,
  MIN_IMAGES,
  MAX_IMAGES,
  MAX_PERSONAL_ACTIVE_LISTINGS,
  MAX_BUSINESS_ACTIVE_LISTINGS,
  MAX_FEATURED_PER_BUSINESS,
  PUBLIC_FEED_DEFAULT_LIMIT,
  PUBLIC_FEED_MAX_LIMIT,
} from '../lib/constants.js';
import { featuredUntilFromNow } from '../lib/featured.js';

const withImages = {
  images: { orderBy: { displayOrder: 'asc' } },
  // Linked shop (business listings) — public link shown only when approved.
  shop: { select: { id: true, name: true, logoUrl: true, status: true } },
};

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
  businessAccount: { select: { businessName: true, businessType: true, sellerStatus: true } },
};

/* GET /api/listings?category=&status=&userId=&featured=&featuredRequested= */
export const listListings = asyncHandler(async (req, res) => {
  const { category, subcategory, postingType, status, userId, featured, featuredRequested } = req.query;
  const isAdmin = req.user?.role === 'admin';
  const where = {};
  if (category) where.category = category;
  if (subcategory) where.subcategory = subcategory;
  if (postingType) where.postingType = postingType;
  // Status is enforced server-side, not trusted from the query: the public feed
  // only ever contains public statuses. Without this, anyone could request
  // ?status=pending (or omit status entirely) and read unmoderated/hidden/
  // rejected listings — including seller phone numbers. Admins (fresh-role via
  // optionalAuth) may filter freely for the moderation queues.
  if (isAdmin) {
    if (status) where.status = status;
    if (featuredRequested !== undefined) where.featuredRequested = featuredRequested;
  } else {
    where.status = status === 'sold' ? 'sold' : 'approved';
  }
  if (userId) where.userId = userId;
  if (featured === true) {
    // "Featured" means the flag is on AND the window hasn't expired.
    where.featuredActive = true;
    where.featuredUntil = { gt: new Date() };
  } else if (featured === false) {
    // Not featured, OR the featured window has expired (the flag can lag expiry).
    where.OR = [{ featuredActive: false }, { featuredUntil: { lte: new Date() } }];
  }

  // Cursor pagination — bounds every query so the public feed can never scan or
  // return the whole listings table in one request. `take + 1` peeks at whether
  // another page exists; id is the stable tiebreaker for the createdAt sort.
  const take = Math.min(req.query.limit || PUBLIC_FEED_DEFAULT_LIMIT, PUBLIC_FEED_MAX_LIMIT);
  const { cursor } = req.query;

  const page = await prisma.listing.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: { ...withImages, user: { select: sellerSelect } },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  let nextCursor = null;
  if (page.length > take) {
    page.pop(); // drop the peeked row — it belongs to the next page
    // Resume AFTER the last row we actually return, so the peeked row is the
    // first item of the next page (cursor + skip:1). Using the peeked row's id
    // here would skip past it and drop one listing at every page boundary.
    nextCursor = page[page.length - 1].id;
  }

  res.json({ listings: page, nextCursor });
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

/* POST /api/listings  (multipart/form-data)
   Text fields validated by listingCreateFieldsSchema; images arrive as real files
   in req.files and are uploaded to Cloudinary BEFORE the listing is created.
   Standard listings go live as 'pending'; featured is never auto-activated. */
export const createListing = asyncHandler(async (req, res) => {
  // Owner comes from the authenticated token, never the request body.
  const userId = req.user.id;
  const { title, description, category, subcategory, price, featuredRequested, details } = req.body;
  const files = req.files || [];

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[createListing] received files', files.map((f) => ({ name: f.originalname, type: f.mimetype, bytes: f.size })));
  }

  // Image-count rule (depends on category). Multer already capped at MAX_IMAGES.
  const optional = IMAGE_OPTIONAL_CATEGORIES.includes(category);
  if (!optional && files.length < MIN_IMAGES) {
    throw new ApiError(422, `At least ${MIN_IMAGES} image is required for ${category} listings.`);
  }
  if (files.length > MAX_IMAGES) {
    throw new ApiError(422, `A listing can have at most ${MAX_IMAGES} images.`);
  }

  // Posting type: commercial categories (food/services) are always business;
  // otherwise the seller's choice (default personal).
  const forcedBusiness = BUSINESS_ONLY_CATEGORIES.includes(category);
  const postingType = forcedBusiness ? 'business' : (req.body.postingType || 'personal');

  // Business listings require an active Business Seller (approved + settled),
  // and link to the poster's Shop (directory) when they have one.
  let shopId = null;
  if (postingType === 'business') {
    const account = await prisma.businessAccount.findUnique({ where: { userId } });
    const settled = account && (account.paymentStatus === 'paid' || account.paymentStatus === 'waived');
    const active = account && account.sellerStatus === 'approved' && settled;
    if (!active) {
      throw new ApiError(403, 'Business selling requires an approved Business Seller account. Apply for Business Seller status to post commercial listings.', { code: 'BUSINESS_ACCOUNT_REQUIRED' });
    }
    const shop = await prisma.shop.findUnique({ where: { userId }, select: { id: true } });
    shopId = shop?.id ?? null;
  }

  // Beta active-listing limit (per posting type). Pending + approved occupy a
  // slot; sold/hidden/rejected free it. Admins are exempt. Counted with Prisma.
  if (req.user.role !== 'admin') {
    const activeCount = await prisma.listing.count({
      where: { userId, postingType, status: { in: ACTIVE_LISTING_STATUSES } },
    });
    if (postingType === 'business') {
      if (activeCount >= MAX_BUSINESS_ACTIVE_LISTINGS) {
        throw new ApiError(409, `You've reached your beta limit of ${MAX_BUSINESS_ACTIVE_LISTINGS} active business listings. Mark one inactive or contact support for more visibility.`, { code: 'BUSINESS_LISTING_LIMIT_REACHED' });
      }
    } else if (activeCount >= MAX_PERSONAL_ACTIVE_LISTINGS) {
      throw new ApiError(409, `You already have ${MAX_PERSONAL_ACTIVE_LISTINGS} active personal listings. Mark one as sold or inactive before posting another.`, { code: 'PERSONAL_LISTING_LIMIT_REACHED' });
    }
  }

  // Drop empty values, then store the attribute map as JSON.
  const cleanedDetails = Object.fromEntries(
    Object.entries(details || {}).filter(([, v]) => v != null && String(v).trim() !== ''),
  );

  // Upload the real file buffers to Cloudinary (verified non-blank) BEFORE
  // creating the listing — if any upload fails, no pending listing is created.
  const storedImages = await storeImageBuffers(files);

  const listing = await prisma.listing.create({
    data: {
      userId,
      title,
      description,
      category,
      subcategory: subcategory || null,
      postingType,
      shopId,
      price,
      featuredRequested,
      featuredActive: false,
      status: 'pending',
      details: Object.keys(cleanedDetails).length ? JSON.stringify(cleanedDetails) : null,
      images: { create: storedImages },
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
  const { status, details, imagesOrder, ...rest } = req.body;
  const files = req.files || [];

  // Status transitions for a non-admin owner: lifecycle moves from a live state
  // (approved/sold/hidden), plus resubmitting a rejected listing (→ pending).
  if (status && req.user.role !== 'admin') {
    const ownerOk =
      OWNER_SETTABLE_STATUSES.includes(existing.status) ||
      (existing.status === 'rejected' && status === 'pending');
    if (!ownerOk) {
      throw new ApiError(400, 'This listing is awaiting review and cannot change status yet.');
    }

    // Re-activating (sold/hidden → approved, rejected → pending) re-occupies a
    // beta slot — re-run the active-listing limit so hiding listings can't be
    // used to stockpile extras beyond the cap.
    if (ACTIVE_LISTING_STATUSES.includes(status) && !ACTIVE_LISTING_STATUSES.includes(existing.status)) {
      const activeCount = await prisma.listing.count({
        where: {
          userId: existing.userId,
          postingType: existing.postingType,
          status: { in: ACTIVE_LISTING_STATUSES },
          id: { not: id },
        },
      });
      const max = existing.postingType === 'business' ? MAX_BUSINESS_ACTIVE_LISTINGS : MAX_PERSONAL_ACTIVE_LISTINGS;
      if (activeCount >= max) {
        throw new ApiError(409, `You've reached your beta limit of ${max} active ${existing.postingType} listings. Mark another one sold or inactive first.`, {
          code: existing.postingType === 'business' ? 'BUSINESS_LISTING_LIMIT_REACHED' : 'PERSONAL_LISTING_LIMIT_REACHED',
        });
      }
    }
  }

  // Subcategory must belong to the listing's (immutable) category — the create
  // path enforces this in the schema; the update path enforces it here.
  if (rest.subcategory !== undefined && !isValidSubcategory(existing.category, rest.subcategory)) {
    throw new ApiError(422, 'Subcategory does not belong to the listing category.');
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

  // Image set — `imagesOrder` describes the final sequence: existing images to
  // keep (by URL) interleaved with placeholders for newly-uploaded files. The
  // whole set is replaced (covers add / remove / reorder). Min-count rule depends
  // on the (unchangeable) category, so it's enforced here.
  if (imagesOrder !== undefined) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[updateListing] received files', files.length, 'order len', imagesOrder.length);
    }
    if (!IMAGE_OPTIONAL_CATEGORIES.includes(existing.category) && imagesOrder.length < MIN_IMAGES) {
      throw new ApiError(422, `At least ${MIN_IMAGES} image is required for ${existing.category} listings.`);
    }
    if (imagesOrder.length > MAX_IMAGES) {
      throw new ApiError(422, `A listing can have at most ${MAX_IMAGES} images.`);
    }

    // "Kept" URLs must be images this listing ALREADY has — otherwise the body
    // could inject an arbitrary external URL (skipping upload validation) into
    // a live listing.
    const current = await prisma.listingImage.findMany({
      where: { listingId: id },
      select: { imageUrl: true },
    });
    const currentUrls = new Set(current.map((im) => im.imageUrl));

    // Upload all new files first, then assemble the ordered set.
    const stored = [];
    for (let i = 0; i < imagesOrder.length; i++) {
      const entry = imagesOrder[i];
      if (entry.kind === 'new') {
        const file = files[entry.idx];
        if (!file) throw new ApiError(422, 'Images could not be uploaded. Please try again.');
        stored.push({ imageUrl: await storeImageBuffer(file), displayOrder: i });
      } else {
        if (!currentUrls.has(entry.url)) {
          throw new ApiError(422, 'Images could not be updated. Please refresh and try again.');
        }
        stored.push({ imageUrl: entry.url, displayOrder: i });
      }
    }
    data.images = { deleteMany: {}, create: stored };
  }

  // Re-moderation: material edits (content, price, details, images) to a listing
  // that would otherwise be publicly live go back to 'pending' review — approval
  // covers the content, not just the initial submission (bait-and-switch guard).
  // Pure lifecycle changes (mark sold / hide / restore without edits) skip this.
  if (req.user.role !== 'admin') {
    const materialEdit =
      ['title', 'description', 'price', 'subcategory'].some((k) => rest[k] !== undefined) ||
      details !== undefined ||
      imagesOrder !== undefined;
    const nextStatus = status !== undefined ? status : existing.status;
    if (materialEdit && nextStatus === 'approved') {
      data.status = 'pending';
    }
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
  if (featuredRequested !== undefined) data.featuredRequested = featuredRequested;

  if (featuredActive === true) {
    // Only business listings can be featured.
    const target = await prisma.listing.findUnique({
      where: { id }, select: { userId: true, postingType: true },
    });
    if (!target) throw new ApiError(404, 'Listing not found.');
    if (target.postingType !== 'business') {
      throw new ApiError(422, 'Only business listings can be featured.', { code: 'FEATURED_REQUIRES_BUSINESS' });
    }
    // Featured-slot cap: count this owner's listings that are featured AND not
    // expired (featuredUntil > now), excluding this listing. Expired slots free
    // automatically. Beta: MAX_FEATURED_PER_BUSINESS, no payment.
    const now = new Date();
    const count = await prisma.listing.count({
      where: { userId: target.userId, featuredActive: true, featuredUntil: { gt: now }, id: { not: id } },
    });
    if (count >= MAX_FEATURED_PER_BUSINESS) {
      throw new ApiError(409, `You've used your ${MAX_FEATURED_PER_BUSINESS} beta featured slots. Remove or wait for one to expire, or contact support for more visibility.`, { code: 'FEATURED_LIMIT_REACHED' });
    }
    data.featuredActive = true;
    data.featuredUntil = featuredUntilFromNow(now); // 14-day beta window
  } else if (featuredActive === false) {
    data.featuredActive = false;
    data.featuredUntil = null; // freeing the slot
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
