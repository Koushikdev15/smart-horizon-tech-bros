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
// Audio/image attachments arrive as base64 JSON, not multipart — React
// Native's New Architecture networking layer doesn't reliably support
// either the classic { uri, name, type } FormData descriptor (rejected
// outright as "Unsupported FormDataPart implementation") or fetching a
// local file:// URI into a real Blob (silently returns a near-empty blob).
// Base64-in-JSON reuses the exact transport every other endpoint already
// uses successfully.
router.post('/session/:sessionId/image-message', controller.sendImageMessage);
router.post('/transcribe', controller.transcribe);

export default router;
