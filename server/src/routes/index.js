import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './users.routes.js';
import listingRoutes from './listings.routes.js';
import businessRoutes from './businessAccounts.routes.js';
import savedRoutes from './saved.routes.js';
import shopRoutes from './shops.routes.js';
import { getStats, getPublicStats } from '../controllers/stats.controller.js';
import { createContactMessage } from '../controllers/contact.controller.js';
import { validate } from '../middleware/validate.js';
import { contactSchema } from '../validators/schemas.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { contactLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'malir-marketplace-api' }));
// Public marketplace stats (homepage/footer); admin /stats stays role-gated.
router.get('/stats/public', getPublicStats);
router.get('/stats', requireAuth, requireRole('admin'), getStats);
// Public contact form submission (rate-limited to curb spam / inbox flooding).
router.post('/contact', contactLimiter, validate(contactSchema), createContactMessage);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/listings', listingRoutes);
router.use('/business-accounts', businessRoutes);
router.use('/saved', savedRoutes);
router.use('/shops', shopRoutes);

export default router;
