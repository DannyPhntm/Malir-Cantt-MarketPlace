import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { shopCreateSchema, shopUpdateSchema, shopStatusSchema, shopQuerySchema, idParamSchema } from '../validators/schemas.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import * as shops from '../controllers/shops.controller.js';

const router = Router();

// Public
router.get('/', validate(shopQuerySchema, 'query'), shops.listShops);

// Authenticated owner (static paths BEFORE /:id)
router.get('/mine', requireAuth, shops.getMyShop);
router.post('/', requireAuth, uploadLimiter, validate(shopCreateSchema), shops.createMyShop);
router.patch('/mine', requireAuth, uploadLimiter, validate(shopUpdateSchema), shops.updateMyShop);

// Admin
router.get('/admin', requireAuth, requireRole('admin'), validate(shopQuerySchema, 'query'), shops.listAllShops);
router.patch('/:id/status', requireAuth, requireRole('admin'), validate(idParamSchema, 'params'), validate(shopStatusSchema), shops.setShopStatus);
router.delete('/:id', requireAuth, requireRole('admin'), validate(idParamSchema, 'params'), shops.deleteShop);

// Public detail (owner/admin can see non-approved)
router.get('/:id', optionalAuth, validate(idParamSchema, 'params'), shops.getShop);

export default router;
