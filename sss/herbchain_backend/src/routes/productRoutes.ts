import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';
import { authenticateSupabaseJWT } from '../middleware/supabaseAuthMiddleware';

const router = Router();
const controller = new ProductController();

// Public — product browsing/lookup is a customer-facing feature (chatbot
// recommendations, QR-scan detail views).
router.get('/', controller.search);
router.post('/', authenticateJWT, requireRole(['Manufacturer']), controller.create);

// Static paths before the generic '/:id' GET below.
router.get('/by-qr/:qrCode', controller.getByQrCode);
// Customer accounts are Supabase-authenticated now — see rollout notes in
// herbchain_backend/.env.example. Every other route on this router (product
// catalog/creation) is Manufacturer-owned and stays on Mongo-JWT.
router.post('/suitability', authenticateSupabaseJWT, controller.checkSuitability);
router.post('/sustainability', controller.getSustainability);
router.get('/purchase', controller.browseForPurchase);

router.get('/:id/offers', controller.getOffers);
router.get('/:id', controller.getById);

export default router;
