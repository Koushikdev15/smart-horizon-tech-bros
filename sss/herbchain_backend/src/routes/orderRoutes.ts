import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { authenticateSupabaseJWT } from '../middleware/supabaseAuthMiddleware';

const router = Router();
const controller = new OrderController();

// Customer accounts are Supabase-authenticated now — see rollout notes in
// herbchain_backend/.env.example.
router.use(authenticateSupabaseJWT);

router.post('/', controller.placeOrder);
router.get('/me', controller.getOwn);
router.get('/:id', controller.getOwnById);

export default router;
