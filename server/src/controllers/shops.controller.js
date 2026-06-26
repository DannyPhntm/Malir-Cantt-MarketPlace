import prisma from '../lib/prisma.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

// Owner fields exposed publicly with a shop.
const ownerSelect = {
  id: true, name: true, businessVerified: true,
  businessAccount: { select: { businessName: true, businessType: true } },
};

// Backend shop row → API shape (parse the images JSON into an array).
function shape(shop) {
  if (!shop) return null;
  let images = [];
  try { images = shop.images ? JSON.parse(shop.images) : []; } catch { images = []; }
  const { images: _raw, user, ...rest } = shop;
  return {
    ...rest,
    images: Array.isArray(images) ? images : [],
    owner: user
      ? { id: user.id, name: user.name, businessName: user.businessAccount?.businessName || null, businessVerified: !!user.businessVerified }
      : null,
  };
}

/* GET /api/shops?shopCategory=&q=  — public: approved shops only. */
export const listShops = asyncHandler(async (req, res) => {
  const { shopCategory, q } = req.query;
  const where = { status: 'approved' };
  if (shopCategory) where.shopCategory = shopCategory;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { sells: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }
  const shops = await prisma.shop.findMany({
    where, orderBy: { createdAt: 'desc' }, include: { user: { select: ownerSelect } },
  });
  res.json({ shops: shops.map(shape) });
});

/* GET /api/shops/mine — the authenticated user's own shop (any status), or null. */
export const getMyShop = asyncHandler(async (req, res) => {
  const shop = await prisma.shop.findUnique({
    where: { userId: req.user.id }, include: { user: { select: ownerSelect } },
  });
  res.json({ shop: shape(shop) });
});

/* GET /api/shops/:id — public for approved; owner/admin for pending/hidden (404 else). */
export const getShop = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const shop = await prisma.shop.findUnique({ where: { id }, include: { user: { select: ownerSelect } } });
  if (!shop) throw new ApiError(404, 'Shop not found.');
  if (shop.status !== 'approved') {
    const isOwner = req.user && shop.userId === req.user.id;
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isOwner && !isAdmin) throw new ApiError(404, 'Shop not found.');
  }
  res.json({ shop: shape(shop) });
});

// Only an approved business account may own a shop.
async function assertApprovedBusiness(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { businessVerified: true } });
  if (!user?.businessVerified) {
    throw new ApiError(403, 'Only approved business accounts can create a shop. Get your Business Seller account approved first.');
  }
}

function toData(body) {
  const data = { ...body };
  if (body.images !== undefined) data.images = body.images?.length ? JSON.stringify(body.images) : null;
  return data;
}

/* POST /api/shops — create the caller's shop (approved business, one per user). */
export const createMyShop = asyncHandler(async (req, res) => {
  await assertApprovedBusiness(req.user.id);
  const existing = await prisma.shop.findUnique({ where: { userId: req.user.id } });
  if (existing) throw new ApiError(409, 'You already have a shop. Edit it instead of creating a new one.');

  const shop = await prisma.shop.create({
    data: { userId: req.user.id, status: 'pending', ...toData(req.body) },
    include: { user: { select: ownerSelect } },
  });
  res.status(201).json({ shop: shape(shop) });
});

/* PATCH /api/shops/mine — update the caller's shop. Status is not owner-editable. */
export const updateMyShop = asyncHandler(async (req, res) => {
  const existing = await prisma.shop.findUnique({ where: { userId: req.user.id } });
  if (!existing) throw new ApiError(404, 'You do not have a shop yet.');
  const shop = await prisma.shop.update({
    where: { userId: req.user.id }, data: toData(req.body), include: { user: { select: ownerSelect } },
  });
  res.json({ shop: shape(shop) });
});

/* ── Admin moderation ── */

/* GET /api/shops/admin?status= — all shops (admin). */
export const listAllShops = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  const shops = await prisma.shop.findMany({
    where, orderBy: { createdAt: 'desc' }, include: { user: { select: ownerSelect } },
  });
  res.json({ shops: shops.map(shape) });
});

/* PATCH /api/shops/:id/status — approve / hide (admin). */
export const setShopStatus = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const exists = await prisma.shop.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new ApiError(404, 'Shop not found.');
  const shop = await prisma.shop.update({
    where: { id }, data: { status: req.body.status }, include: { user: { select: ownerSelect } },
  });
  res.json({ shop: shape(shop) });
});

/* DELETE /api/shops/:id — remove a shop (admin). */
export const deleteShop = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await prisma.shop.delete({ where: { id } }).catch(() => { throw new ApiError(404, 'Shop not found.'); });
  res.json({ deleted: true });
});
