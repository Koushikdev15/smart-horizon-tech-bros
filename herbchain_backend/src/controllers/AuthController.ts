import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { sendResponse } from '../utils/response';
import { registerSchema, loginSchema } from '../validators/authValidator';

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = registerSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }

      const result = await this.authService.register(req.body);
      return sendResponse(res, 201, true, 'User registered successfully', result);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = loginSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }

      const result = await this.authService.login(req.body.email, req.body.password);
      return sendResponse(res, 200, true, 'Login successful', result);
    } catch (err) {
      next(err);
    }
  };
}
