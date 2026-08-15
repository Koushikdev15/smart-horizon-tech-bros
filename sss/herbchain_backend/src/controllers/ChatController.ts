import { Response, NextFunction } from 'express';
import { ChatbotService } from '../services/ChatbotService';
import { sendResponse } from '../utils/response';
import { sendMessageSchema } from '../validators/chatValidator';
import { AuthRequest } from '../middleware/authMiddleware';

export class ChatController {
  private chatbotService = new ChatbotService();

  createSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.chatbotService.createSession(req.user.id);
      return sendResponse(res, 201, true, 'Chat session created', result);
    } catch (err) {
      next(err);
    }
  };

  listSessions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.chatbotService.listSessions(req.user.id);
      return sendResponse(res, 200, true, 'Chat sessions fetched', result);
    } catch (err) {
      next(err);
    }
  };

  getSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.chatbotService.getSession(req.user.id, req.params.sessionId as string);
      return sendResponse(res, 200, true, 'Chat session fetched', result);
    } catch (err) {
      next(err);
    }
  };

  sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = sendMessageSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }
      const result = await this.chatbotService.sendMessage(req.user.id, req.params.sessionId as string, value.content, value.coordinates);
      return sendResponse(res, 200, true, 'Message sent', result);
    } catch (err) {
      next(err);
    }
  };
}
