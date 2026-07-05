import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { updateUserSchema, userListQuerySchema, blockUserSchema, idParamSchema } from '../validators/schemas.js';
import * as users from '../controllers/users.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), validate(userListQuerySchema, 'query'), users.listUsers);
router.get('/:id', requireAuth, validate(idParamSchema, 'params'), users.getUser);
router.patch('/:id', requireAuth, validate(idParamSchema, 'params'), validate(updateUserSchema), users.updateUser);
// Admin moderation — reversible block / unblock.
router.patch('/:id/block', requireAuth, requireRole('admin'), validate(idParamSchema, 'params'), validate(blockUserSchema), users.blockUser);
router.patch('/:id/unblock', requireAuth, requireRole('admin'), validate(idParamSchema, 'params'), users.unblockUser);

export default router;
