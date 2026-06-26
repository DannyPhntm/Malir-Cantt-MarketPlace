import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { shopCreateSchema, shopUpdateSchema, shopStatusSchema, shopQuerySchema } from '../validators/schemas.js';
import * as shops from '../controllers/shops.controller.js';

const router = Router();

// Public
router.get('/', validate(shopQuerySchema, 'query'), shops.listShops);

// Authenticated owner (static paths BEFORE /:id)
router.get('/mine', requireAuth, shops.getMyShop);
router.post('/', requireAuth, validate(shopCreateSchema), shops.createMyShop);
router.patch('/mine', requireAuth, validate(shopUpdateSchema), shops.updateMyShop);

// Admin
router.get('/admin', requireAuth, requireRole('admin'), validate(shopQuerySchema, 'query'), shops.listAllShops);
router.patch('/:id/status', requireAuth, requireRole('admin'), validate(shopStatusSchema), shops.setShopStatus);
router.delete('/:id', requireAuth, requireRole('admin'), shops.deleteShop);

// Public detail (owner/admin can see non-approved)
router.get('/:id', optionalAuth, shops.getShop);

export default router;
