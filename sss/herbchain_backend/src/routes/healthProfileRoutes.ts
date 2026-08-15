import { Router } from 'express';
import { HealthProfileController } from '../controllers/HealthProfileController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();
const healthProfileController = new HealthProfileController();

router.use(authenticateJWT);

router.get('/', healthProfileController.get);
router.put('/', healthProfileController.upsert);
router.delete('/', healthProfileController.remove);

export default router;
