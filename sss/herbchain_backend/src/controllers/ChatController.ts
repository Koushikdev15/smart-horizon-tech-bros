import { Response, NextFunction } from 'express';
import { ChatbotService } from '../services/ChatbotService';
import { sendResponse } from '../utils/response';
import { sendMessageSchema, sendImageMessageSchema, transcribeAudioSchema } from '../validators/chatValidator';
import { SupabaseAuthRequest } from '../middleware/supabaseAuthMiddleware';

export class ChatController {
  private chatbotService = new ChatbotService();

  transcribe = async (req: SupabaseAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = transcribeAudioSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }
      const buffer = Buffer.from(value.audioBase64, 'base64');
      console.log(`[transcribe] received audio: ${buffer.length} bytes, mimetype=${value.mimeType}`);
      if (buffer.length === 0) {
        return sendResponse(res, 400, false, 'The recording appears to be empty.');
      }
      const result = await this.chatbotService.transcribe(req.supabaseUser!.id, buffer, value.mimeType);
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
        value.coordinates,
        value.doctorId
      );
      return sendResponse(res, 200, true, 'Message sent', result);
    } catch (err) {
      next(err);
    }
  };

  sendImageMessage = async (req: SupabaseAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = sendImageMessageSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }
      const buffer = Buffer.from(value.imageBase64, 'base64');
      console.log(`[sendImageMessage] received attachment: ${buffer.length} bytes, mimetype=${value.mimeType}`);
      if (buffer.length === 0) {
        return sendResponse(res, 400, false, 'The attached file appears to be empty.');
      }

      const content = (value.content as string | undefined)?.trim() || 'What can you tell me about this image?';
      const result = await this.chatbotService.sendMessage(
        req.supabaseUser!.id,
        req.params.sessionId as string,
        content,
        value.coordinates,
        value.doctorId,
        { mimeType: value.mimeType, data: value.imageBase64 }
      );
      return sendResponse(res, 200, true, 'Message sent', result);
    } catch (err) {
      next(err);
    }
  };
}
