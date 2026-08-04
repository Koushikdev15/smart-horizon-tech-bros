import { Router } from 'express';
import multer from 'multer';
import { CollectionController } from '../controllers/CollectionController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();
const controller = new CollectionController();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  '/',
  authenticateJWT,
  requireRole(['Farmer', 'Wild Collector']),
  upload.single('image'),
  controller.submit
);

router.get(
  '/',
  authenticateJWT,
  requireRole(['Collection Center', 'Government', 'Processing & Laboratory']),
  controller.getAll
);

router.get(
  '/:id',
  authenticateJWT,
  controller.getById
);

export default router;
