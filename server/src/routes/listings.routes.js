import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import {
  listingCreateFieldsSchema,
  listingUpdateFieldsSchema,
  listingStatusSchema,
  listingQuerySchema,
  idParamSchema,
} from '../validators/schemas.js';
import * as listings from '../controllers/listings.controller.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { uploadListingImages } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Owner's own listings (all statuses) — must precede the public `/:id` route.
router.get('/mine', requireAuth, listings.listMine);

// Public reads. Both use optionalAuth: the feed forces status='approved' for
// non-admins (admins may filter moderation queues); the detail route lets
// owners/admins view their own private (pending/hidden/rejected) listings.
router.get('/', optionalAuth, validate(listingQuerySchema, 'query'), listings.listListings);
router.get('/:id', optionalAuth, validate(idParamSchema, 'params'), listings.getListing);

// Authenticated writes — owner derived from token; edit/delete enforce ownership.
// Multipart: `uploadListingImages` parses files (req.files) + text fields, then the
// field schema validates the (stringified) text body.
router.post('/', requireAuth, uploadLimiter, uploadListingImages, validate(listingCreateFieldsSchema), listings.createListing);
router.patch('/:id', requireAuth, uploadLimiter, validate(idParamSchema, 'params'), uploadListingImages, validate(listingUpdateFieldsSchema), listings.updateListing);
router.delete('/:id', requireAuth, validate(idParamSchema, 'params'), listings.deleteListing);

// Moderation — admin only.
router.patch('/:id/status', requireAuth, requireRole('admin'), validate(idParamSchema, 'params'), validate(listingStatusSchema), listings.setListingStatus);

export default router;
