import { Router } from 'express';
import multer from 'multer';
import { DoctorController } from '../controllers/DoctorController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();
const controller = new DoctorController();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Public — browsing verified doctors is a customer-facing feature (consult a
// verified doctor, region-matched guidance authorship, etc). Only ever
// returns verificationStatus: VERIFIED records — see DoctorService.
router.get('/', controller.listVerified);

// Static paths must be registered before the '/:id' param route below.
router.get('/me', authenticateJWT, requireRole(['Doctor']), controller.getOwn);
router.post('/me', authenticateJWT, requireRole(['Doctor']), controller.submit);
router.post('/me/documents', authenticateJWT, requireRole(['Doctor']), upload.single('file'), controller.addDocument);

router.get('/:id', controller.getVerifiedById);

export default router;
