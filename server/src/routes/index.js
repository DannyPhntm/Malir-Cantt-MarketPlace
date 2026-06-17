import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './users.routes.js';
import listingRoutes from './listings.routes.js';
import businessRoutes from './businessAccounts.routes.js';
import savedRoutes from './saved.routes.js';
import { getStats } from '../controllers/stats.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'malir-marketplace-api' }));
router.get('/stats', requireAuth, requireRole('admin'), getStats);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/listings', listingRoutes);
router.use('/business-accounts', businessRoutes);
router.use('/saved', savedRoutes);

export default router;
