import { Router } from 'express';
import { AdminDoctorGuidanceController } from '../controllers/AdminDoctorGuidanceController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();
const controller = new AdminDoctorGuidanceController();

router.use(authenticateJWT, requireRole(['Admin']));

router.get('/submitted', controller.listSubmitted);
router.get('/:versionId', controller.getVersionDetail);
router.put('/:versionId/approve', controller.approve);
router.put('/:versionId/reject', controller.reject);

export default router;
