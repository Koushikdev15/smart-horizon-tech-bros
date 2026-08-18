import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { authenticateSupabaseJWT } from '../middleware/supabaseAuthMiddleware';

const router = Router();
const controller = new ChatController();

// Customer accounts are Supabase-authenticated now — see rollout notes in
// herbchain_backend/.env.example.
router.use(authenticateSupabaseJWT);

router.post('/session', controller.createSession);
router.get('/session', controller.listSessions);
router.get('/session/:sessionId', controller.getSession);
router.post('/session/:sessionId/message', controller.sendMessage);

export default router;
