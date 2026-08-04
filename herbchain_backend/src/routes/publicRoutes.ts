import { Router } from 'express';
import { PublicController } from '../controllers/PublicController';

const router = Router();
const controller = new PublicController();

router.get('/provenance/:batchId', controller.getProvenance);

export default router;
