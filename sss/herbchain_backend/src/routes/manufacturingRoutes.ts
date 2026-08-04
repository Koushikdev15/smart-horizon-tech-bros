import { Router } from 'express';
import { ManufacturingController } from '../controllers/ManufacturingController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();
const controller = new ManufacturingController();

router.post(
  '/',
  authenticateJWT,
  requireRole(['Manufacturer']),
  controller.create
);

export default router;
