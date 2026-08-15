import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();
const controller = new ChatController();

router.use(authenticateJWT);

router.post('/session', controller.createSession);
router.get('/session', controller.listSessions);
router.get('/session/:sessionId', controller.getSession);
router.post('/session/:sessionId/message', controller.sendMessage);

export default router;
