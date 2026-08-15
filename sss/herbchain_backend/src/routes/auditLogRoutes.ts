import { Router } from 'express';
import { AuditLogController } from '../controllers/AuditLogController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();
const controller = new AuditLogController();

router.use(authenticateJWT, requireRole(['Admin']));
router.get('/', controller.list);

export default router;
