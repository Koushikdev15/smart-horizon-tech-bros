import { Router } from 'express';
import { AdminDoctorController } from '../controllers/AdminDoctorController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();
const controller = new AdminDoctorController();

router.use(authenticateJWT, requireRole(['Admin']));

router.get('/pending', controller.listPending);
router.get('/:id/audit-logs', controller.auditLogs);
router.get('/:id', controller.getFullDetail);
router.get('/', controller.listAll);

router.put('/:id/approve', controller.approve);
router.put('/:id/reject', controller.reject);
router.put('/:id/suspend', controller.suspend);
router.put('/:id/revoke', controller.revoke);

export default router;
