import { Router } from 'express';
import { AccountController } from '../controllers/AccountController';
import { authenticateSupabaseJWT } from '../middleware/supabaseAuthMiddleware';

const router = Router();
const controller = new AccountController();

router.use(authenticateSupabaseJWT);

router.delete('/', controller.deleteAccount);

export default router;
