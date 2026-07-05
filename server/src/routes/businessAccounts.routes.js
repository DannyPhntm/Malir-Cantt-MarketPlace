import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { businessApplySchema, sellerApplySchema, businessDecisionSchema, idParamSchema } from '../validators/schemas.js';
import * as biz from '../controllers/businessAccounts.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import { uploadBusinessDocs } from '../middleware/upload.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), biz.listBusinessAccounts);
// Multipart: parse verification/CNIC files first, then validate the text fields.
router.post('/', requireAuth, uploadLimiter, uploadBusinessDocs, validate(businessApplySchema), biz.applyForBusiness);
router.post('/apply', requireAuth, validate(sellerApplySchema), biz.applyForSeller);
router.get('/:id', requireAuth, validate(idParamSchema, 'params'), biz.getBusinessAccount);
router.patch('/:id/decision', requireAuth, requireRole('admin'), validate(idParamSchema, 'params'), validate(businessDecisionSchema), biz.decideBusinessAccount);

export default router;
