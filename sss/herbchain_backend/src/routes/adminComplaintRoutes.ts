import { Router } from 'express';
import { AdminComplaintController } from '../controllers/AdminComplaintController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();
const controller = new AdminComplaintController();

router.use(authenticateJWT, requireRole(['Admin']));

router.get('/', controller.listAll);
router.put('/:id/status', controller.updateStatus);

export default router;
