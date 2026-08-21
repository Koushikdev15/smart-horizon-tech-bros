import { Response, NextFunction } from 'express';
import { ChatbotService } from '../services/ChatbotService';
import { sendResponse } from '../utils/response';
import { sendMessageSchema } from '../validators/chatValidator';
import { SupabaseAuthRequest } from '../middleware/supabaseAuthMiddleware';

interface MulterAuthRequest extends SupabaseAuthRequest {
  file?: Express.Multer.File;
}

export class ChatController {
  private chatbotService = new ChatbotService();

  transcribe = async (req: MulterAuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return sendResponse(res, 400, false, 'No audio file provided.');
      }
      const language = req.body.language === 'ta' ? 'ta' : req.body.language === 'en' ? 'en' : undefined;
      const result = await this.chatbotService.transcribe(
        req.supabaseUser!.id,
        req.file.buffer,
        req.file.mimetype,
        language
      );
      return sendResponse(res, 200, true, 'Audio transcribed', result);
    } catch (err) {
      next(err);
    }
  };

  createSession = async (req: SupabaseAuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.chatbotService.createSession(req.supabaseUser!.id);
      return sendResponse(res, 201, true, 'Chat session created', result);
    } catch (err) {
      next(err);
    }
  };

  listSessions = async (req: SupabaseAuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.chatbotService.listSessions(req.supabaseUser!.id);
      return sendResponse(res, 200, true, 'Chat sessions fetched', result);
    } catch (err) {
      next(err);
    }
  };

  getSession = async (req: SupabaseAuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.chatbotService.getSession(req.supabaseUser!.id, req.params.sessionId as string);
      return sendResponse(res, 200, true, 'Chat session fetched', result);
    } catch (err) {
      next(err);
    }
  };

  sendMessage = async (req: SupabaseAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = sendMessageSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }
      const result = await this.chatbotService.sendMessage(
        req.supabaseUser!.id,
        req.params.sessionId as string,
        value.content,
        value.coordinates
      );
      return sendResponse(res, 200, true, 'Message sent', result);
    } catch (err) {
      next(err);
    }
  };
}
