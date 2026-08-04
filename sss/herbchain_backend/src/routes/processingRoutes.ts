import { Router } from 'express';
import multer from 'multer';
import { ProcessingController } from '../controllers/ProcessingController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();
const controller = new ProcessingController();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  '/',
  authenticateJWT,
  requireRole(['Processing & Laboratory']),
  upload.single('report'),
  controller.addStep
);

export default router;
