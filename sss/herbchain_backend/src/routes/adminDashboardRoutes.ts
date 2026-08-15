import { Router } from 'express';
import { AdminDashboardController } from '../controllers/AdminDashboardController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();
const controller = new AdminDashboardController();

router.use(authenticateJWT, requireRole(['Admin']));
router.get('/stats', controller.getStats);

export default router;
