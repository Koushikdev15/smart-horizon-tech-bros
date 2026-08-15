import { Router } from 'express';
import { ComplaintController } from '../controllers/ComplaintController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();
const controller = new ComplaintController();

router.use(authenticateJWT);

router.post('/', controller.submit);
router.get('/me', controller.getOwn);

export default router;
