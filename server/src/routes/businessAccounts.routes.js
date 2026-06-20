import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { businessApplySchema, sellerApplySchema, businessDecisionSchema } from '../validators/schemas.js';
import * as biz from '../controllers/businessAccounts.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), biz.listBusinessAccounts);
router.post('/', requireAuth, validate(businessApplySchema), biz.applyForBusiness);
router.post('/apply', requireAuth, validate(sellerApplySchema), biz.applyForSeller);
router.get('/:id', requireAuth, biz.getBusinessAccount);
router.patch('/:id/decision', requireAuth, requireRole('admin'), validate(businessDecisionSchema), biz.decideBusinessAccount);

export default router;
