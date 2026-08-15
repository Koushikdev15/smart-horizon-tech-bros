import { Router } from 'express';
import { StoreController } from '../controllers/StoreController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();
const controller = new StoreController();

const STORE_OWNER_ROLES = ['Pharmacy', 'Distributor'];

// Public — finding nearby stores is a customer-facing (and guest-facing) feature.
router.get('/nearby', controller.findNearby);

router.post('/', authenticateJWT, requireRole(STORE_OWNER_ROLES), controller.create);
router.get('/me', authenticateJWT, requireRole(STORE_OWNER_ROLES), controller.getOwn);
router.put('/me', authenticateJWT, requireRole(STORE_OWNER_ROLES), controller.update);
router.get('/me/inventory', authenticateJWT, requireRole(STORE_OWNER_ROLES), controller.getOwnInventory);
router.put('/me/inventory', authenticateJWT, requireRole(STORE_OWNER_ROLES), controller.upsertInventory);

export default router;
