import { Request, Response, NextFunction } from 'express';
import { DoctorService } from '../services/DoctorService';
import { sendResponse } from '../utils/response';
import { submitDoctorSchema } from '../validators/doctorValidator';
import { DOCTOR_DOCUMENT_TYPES, DoctorDocumentType } from '../models/DoctorDocument';
import { AuthRequest } from '../middleware/authMiddleware';

export class DoctorController {
  private doctorService = new DoctorService();

  submit = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = submitDoctorSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }

      const result = await this.doctorService.submit(req.user.id, value);
      return sendResponse(res, 201, true, 'Doctor profile submitted for review', result);
    } catch (err) {
      next(err);
    }
  };

  getOwn = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.doctorService.getOwn(req.user.id);
      return sendResponse(res, 200, true, result ? 'Doctor profile fetched' : 'No doctor profile submitted yet', result);
    } catch (err) {
      next(err);
    }
  };

  addDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return sendResponse(res, 400, false, 'A file is required');
      }
      const type = req.body.type as DoctorDocumentType;
      if (!DOCTOR_DOCUMENT_TYPES.includes(type)) {
        return sendResponse(res, 400, false, `type must be one of: ${DOCTOR_DOCUMENT_TYPES.join(', ')}`);
      }

      const result = await this.doctorService.addDocument(req.user.id, type, req.file);
      return sendResponse(res, 201, true, 'Document uploaded', result);
    } catch (err) {
      next(err);
    }
  };

  listVerified = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { region, specialization, language } = req.query as Record<string, string>;
      const result = await this.doctorService.listVerified({ region, specialization, language });
      return sendResponse(res, 200, true, 'Verified doctors fetched', result);
    } catch (err) {
      next(err);
    }
  };

  getVerifiedById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.doctorService.getVerifiedById(req.params.id as string);
      return sendResponse(res, 200, true, 'Doctor fetched', result);
    } catch (err) {
      next(err);
    }
  };
}
