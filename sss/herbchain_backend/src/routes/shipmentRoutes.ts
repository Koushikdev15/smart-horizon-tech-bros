import { Router } from 'express';
import { ShipmentController } from '../controllers/ShipmentController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();
const controller = new ShipmentController();

router.post(
  '/',
  authenticateJWT,
  requireRole(['Supply Chain', 'Manufacturer']),
  controller.create
);

export default router;
