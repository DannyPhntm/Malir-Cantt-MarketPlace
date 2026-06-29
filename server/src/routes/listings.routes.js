import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import {
  listingCreateFieldsSchema,
  listingUpdateFieldsSchema,
  listingStatusSchema,
  listingQuerySchema,
} from '../validators/schemas.js';
import * as listings from '../controllers/listings.controller.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { uploadListingImages } from '../middleware/upload.js';

const router = Router();

// Owner's own listings (all statuses) — must precede the public `/:id` route.
router.get('/mine', requireAuth, listings.listMine);

// Public reads (approved feed + detail). Detail uses optionalAuth so owners/admins
// can view their own private (pending/hidden/rejected) listings by direct URL.
router.get('/', validate(listingQuerySchema, 'query'), listings.listListings);
router.get('/:id', optionalAuth, listings.getListing);

// Authenticated writes — owner derived from token; edit/delete enforce ownership.
// Multipart: `uploadListingImages` parses files (req.files) + text fields, then the
// field schema validates the (stringified) text body.
router.post('/', requireAuth, uploadListingImages, validate(listingCreateFieldsSchema), listings.createListing);
router.patch('/:id', requireAuth, uploadListingImages, validate(listingUpdateFieldsSchema), listings.updateListing);
router.delete('/:id', requireAuth, listings.deleteListing);

// Moderation — admin only.
router.patch('/:id/status', requireAuth, requireRole('admin'), validate(listingStatusSchema), listings.setListingStatus);

export default router;
