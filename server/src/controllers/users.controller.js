import prisma from '../lib/prisma.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { storeImage } from '../lib/imageStorage.js';

function publicUser(user) {
  if (!user) return user;
  const { passwordHash, ...rest } = user;
  return rest;
}

/* GET /api/users?search= — admin user list (optional name/email search). */
export const listUsers = asyncHandler(async (req, res) => {
  const search = req.query.search?.trim();
  // Postgres `contains` is case-sensitive by default — search should not be.
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { businessAccount: true, _count: { select: { listings: true } } },
  });
  res.json({ users: users.map(publicUser) });
});

// Only the user themselves or an admin may read/modify a user record.
function assertSelfOrAdmin(id, reqUser) {
  if (id !== reqUser.id && reqUser.role !== 'admin') {
    throw new ApiError(403, 'Not authorised for this account.');
  }
}

/* GET /api/users/:id */
export const getUser = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  assertSelfOrAdmin(id, req.user);
  const user = await prisma.user.findUnique({
    where: { id },
    include: { businessAccount: true, listings: { include: { images: true } } },
  });
  if (!user) throw new ApiError(404, 'User not found.');
  res.json({ user: publicUser(user) });
});

/* PATCH /api/users/:id */
export const updateUser = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  assertSelfOrAdmin(id, req.user);
  // Explicit field allow-list (defense-in-depth): updateUserSchema already
  // strips unknown keys, but the controller must not rely on the validator
  // alone as the boundary between profile edits and privileged fields
  // (role / accountType / businessVerified / isBlocked stay unreachable).
  const { name, phone, residentLocation, canttPassNumber, avatarUrl } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (phone !== undefined) data.phone = phone;
  if (residentLocation !== undefined) data.residentLocation = residentLocation;
  if (canttPassNumber !== undefined) data.canttPassNumber = canttPassNumber;
  if (avatarUrl !== undefined) {
    // Route avatars through the image pipeline: base64 → Cloudinary in prod
    // (validated as a real image) instead of persisting raw base64 blobs.
    data.avatarUrl = avatarUrl === null ? null : await storeImage(avatarUrl, { folder: 'avatars' });
  }
  const user = await prisma.user.update({ where: { id }, data });
  res.json({ user: publicUser(user) });
});

/* PATCH /api/users/:id/block — admin only. Reversible suspension; never deletes
   data. An admin cannot block their own account or another admin (avoids lockout). */
export const blockUser = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) throw new ApiError(400, 'You cannot block your own account.');

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) throw new ApiError(404, 'User not found.');
  if (target.role === 'admin') throw new ApiError(400, 'Admin accounts cannot be blocked.');

  const user = await prisma.user.update({
    where: { id },
    data: {
      isBlocked: true,
      blockedAt: new Date(),
      blockedReason: req.body.reason || null,
      blockedByAdminId: req.user.id,
    },
  });
  res.json({ user: publicUser(user) });
});

/* PATCH /api/users/:id/unblock — admin only. Restores access; clears block meta. */
export const unblockUser = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!target) throw new ApiError(404, 'User not found.');

  const user = await prisma.user.update({
    where: { id },
    data: { isBlocked: false, blockedAt: null, blockedReason: null, blockedByAdminId: null },
  });
  res.json({ user: publicUser(user) });
});
