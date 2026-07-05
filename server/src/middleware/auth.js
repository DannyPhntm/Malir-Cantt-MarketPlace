import { verifyToken } from '../lib/jwt.js';
import { ApiError } from './errorHandler.js';
import prisma from '../lib/prisma.js';

export const ACCOUNT_BLOCKED_MESSAGE = 'Your account has been restricted. Please contact support.';

// Extracts and verifies the Bearer token, attaching { id, role } to req.user.
// Looks the user up so role is always fresh and a blocked account is denied
// immediately on every protected route (not frontend-only). 401 when the token
// is missing/invalid/stale; 403 when the account is blocked.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'Authentication required.'));
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return next(new ApiError(401, 'Invalid or expired session. Please sign in again.'));
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isBlocked: true },
    });
    if (!user) return next(new ApiError(401, 'Invalid or expired session. Please sign in again.'));
    if (user.isBlocked) return next(new ApiError(403, ACCOUNT_BLOCKED_MESSAGE, { code: 'ACCOUNT_BLOCKED' }));
    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}

// Attaches req.user when a valid token is present, but never blocks the request.
// Used by endpoints that are public yet behave differently for owners/admins.
// Mirrors requireAuth's DB lookup so role is fresh and a blocked (or deleted)
// account is treated as anonymous — a stale token can't keep admin/owner access
// to private records after demotion or blocking.
export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return next(); // invalid token → anonymous
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isBlocked: true },
    });
    if (user && !user.isBlocked) req.user = { id: user.id, role: user.role };
  } catch {
    /* DB hiccup → treat as anonymous; downstream queries will surface real errors */
  }
  next();
}

// Requires a specific role (use after requireAuth).
export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) return next(new ApiError(403, 'Admin access required.'));
    next();
  };
}
