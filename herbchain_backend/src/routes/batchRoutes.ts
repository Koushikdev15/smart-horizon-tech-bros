import { Router } from 'express';
import { BatchController } from '../controllers/BatchController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();
const controller = new BatchController();

router.post(
  '/',
  authenticateJWT,
  requireRole(['Collection Center']),
  controller.create
);

router.get(
  '/',
  authenticateJWT,
  requireRole(['Collection Center', 'Processing & Laboratory', 'Manufacturer', 'Government']),
  controller.getAll
);

export default router;
