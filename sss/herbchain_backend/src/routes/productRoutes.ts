import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();
const controller = new ProductController();

// Public — product browsing/lookup is a customer-facing feature (chatbot
// recommendations, QR-scan detail views).
router.get('/', controller.search);
router.post('/', authenticateJWT, requireRole(['Manufacturer']), controller.create);

// Static paths before the generic '/:id' GET below.
router.get('/by-qr/:qrCode', controller.getByQrCode);
router.post('/suitability', authenticateJWT, controller.checkSuitability);
router.get('/purchase', controller.browseForPurchase);

router.get('/:id/offers', controller.getOffers);
router.get('/:id', controller.getById);

export default router;
