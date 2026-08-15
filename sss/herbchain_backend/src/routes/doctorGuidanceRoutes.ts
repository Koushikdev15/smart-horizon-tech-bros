import { Router } from 'express';
import { DoctorGuidanceController } from '../controllers/DoctorGuidanceController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();
const controller = new DoctorGuidanceController();

// Public — customers browsing guidance relevant to a product/topic/region.
// Only ever returns PUBLISHED content from a currently-VERIFIED doctor.
router.get('/', controller.listPublished);

router.post('/', authenticateJWT, requireRole(['Doctor']), controller.createDraft);

// Static paths before the generic '/:guidanceId' GET below.
router.get('/me', authenticateJWT, requireRole(['Doctor']), controller.listOwn);
router.get('/me/:guidanceId/versions', authenticateJWT, requireRole(['Doctor']), controller.getOwnVersionHistory);
router.post('/:guidanceId/versions', authenticateJWT, requireRole(['Doctor']), controller.createNewVersion);
router.put('/versions/:versionId/submit', authenticateJWT, requireRole(['Doctor']), controller.submit);

router.get('/:guidanceId', controller.getPublished);

export default router;
