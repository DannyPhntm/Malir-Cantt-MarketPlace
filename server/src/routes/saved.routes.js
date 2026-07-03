import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { savedAddSchema, listingIdParamSchema } from '../validators/schemas.js';
import { requireAuth } from '../middleware/auth.js';
import * as saved from '../controllers/saved.controller.js';

const router = Router();

router.get('/', requireAuth, saved.listSaved);
router.post('/', requireAuth, validate(savedAddSchema), saved.addSaved);
router.delete('/:listingId', requireAuth, validate(listingIdParamSchema, 'params'), saved.removeSaved);

export default router;
