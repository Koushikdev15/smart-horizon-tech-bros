import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);

// Placeholder for protected route test
router.get('/profile', authenticateJWT, (req: any, res) => {
  res.json({ success: true, data: req.user });
});

export default router;
