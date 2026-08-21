import { Router } from 'express';
import { RazorpayController } from '../controllers/RazorpayController';
import { authenticateSupabaseJWT } from '../middleware/supabaseAuthMiddleware';

const router = Router();
const controller = new RazorpayController();

// Customer accounts are Supabase-authenticated now — see rollout notes in
// herbchain_backend/.env.example.
router.use(authenticateSupabaseJWT);

router.post('/create-order', controller.createPaymentOrder);
router.post('/verify', controller.verifyPayment);

export default router;
