import { Doctor, IDoctor } from '../models/Doctor';
import { DoctorDocument, DoctorDocumentType } from '../models/DoctorDocument';
import { IpfsService } from '../integrations/ipfs/IpfsService';
import { AuditLogService } from './AuditLogService';

const PUBLIC_FIELDS = 'name qualification specialization clinic region state country languages verifiedAt verificationStatus';

export class DoctorService {
  private ipfsService = new IpfsService();
  private auditLogService = new AuditLogService();

  async submit(userId: string, data: Partial<IDoctor>) {
    const existing = await Doctor.findOne({ userId });

    if (existing && existing.verificationStatus !== 'REJECTED') {
      throw {
        status: 400,
        message: `You already have a doctor profile with status ${existing.verificationStatus}. Contact an administrator to make changes.`,
        isOperational: true,
      };
    }

    try {
      let doctor: IDoctor;
      if (existing) {
        existing.set({
          ...data,
          verificationStatus: 'PENDING',
          statusReason: undefined,
        });
        doctor = await existing.save();
      } else {
        doctor = await Doctor.create({ ...data, userId, verificationStatus: 'PENDING' });
      }

      await this.auditLogService.record({
        actorId: userId,
        action: 'DOCTOR_SUBMITTED',
        targetType: 'Doctor',
        targetId: String(doctor._id),
        previousStatus: existing?.verificationStatus,
        newStatus: 'PENDING',
      });

      return doctor;
    } catch (err: any) {
      if (err?.code === 11000) {
        throw { status: 400, message: 'This registration number is already registered.', isOperational: true };
      }
      throw err;
    }
  }

  async getOwn(userId: string) {
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) return null;
    const documents = await DoctorDocument.find({ doctorId: doctor._id });
    return { ...doctor.toObject(), documents };
  }

  async addDocument(userId: string, type: DoctorDocumentType, file: Express.Multer.File) {
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw { status: 404, message: 'Submit your doctor profile before uploading documents.', isOperational: true };
    }

    const storageRef = await this.ipfsService.uploadDocument(file.buffer, type);
    return DoctorDocument.create({
      doctorId: doctor._id,
      type,
      fileName: file.originalname,
      mimeType: file.mimetype,
      storageRef,
    });
  }

  async listVerified(filters: { region?: string; specialization?: string; language?: string }) {
    const query: Record<string, unknown> = { verificationStatus: 'VERIFIED' };
    if (filters.region) query.region = new RegExp(`^${filters.region}$`, 'i');
    if (filters.specialization) query.specialization = new RegExp(filters.specialization, 'i');
    if (filters.language) query.languages = new RegExp(`^${filters.language}$`, 'i');
    return Doctor.find(query).select(PUBLIC_FIELDS).sort({ verifiedAt: -1 });
  }

  async getVerifiedById(id: string) {
    const doctor = await Doctor.findOne({ _id: id, verificationStatus: 'VERIFIED' }).select(PUBLIC_FIELDS);
    if (!doctor) {
      throw { status: 404, message: 'Doctor not found', isOperational: true };
    }
    return doctor;
  }
}
