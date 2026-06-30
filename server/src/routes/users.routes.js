import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { updateUserSchema, userListQuerySchema, blockUserSchema } from '../validators/schemas.js';
import * as users from '../controllers/users.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), validate(userListQuerySchema, 'query'), users.listUsers);
router.get('/:id', requireAuth, users.getUser);
router.patch('/:id', requireAuth, validate(updateUserSchema), users.updateUser);
// Admin moderation — reversible block / unblock.
router.patch('/:id/block', requireAuth, requireRole('admin'), validate(blockUserSchema), users.blockUser);
router.patch('/:id/unblock', requireAuth, requireRole('admin'), users.unblockUser);

export default router;
