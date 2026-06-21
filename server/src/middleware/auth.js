import { verifyToken } from '../lib/jwt.js';
import { ApiError } from './errorHandler.js';

// Extracts and verifies the Bearer token, attaching { id, role } to req.user.
// Throws 401 when missing or invalid.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'Authentication required.'));
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired session. Please sign in again.'));
  }
}

// Attaches req.user when a valid token is present, but never blocks the request.
// Used by endpoints that are public yet behave differently for owners/admins.
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = verifyToken(token);
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      /* ignore an invalid token — treat as anonymous */
    }
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
