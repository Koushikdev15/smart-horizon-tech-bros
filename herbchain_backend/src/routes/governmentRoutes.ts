import { Router } from 'express';
import { GovernmentController } from '../controllers/GovernmentController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();
const controller = new GovernmentController();

router.get(
  '/analytics',
  authenticateJWT,
  requireRole(['Government']),
  controller.getAnalytics
);

export default router;
