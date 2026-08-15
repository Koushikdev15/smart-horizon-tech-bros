import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();
const controller = new OrderController();

router.use(authenticateJWT);

router.post('/', controller.placeOrder);
router.get('/me', controller.getOwn);
router.get('/:id', controller.getOwnById);

export default router;
