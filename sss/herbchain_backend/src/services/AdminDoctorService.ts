import { Doctor, DoctorVerificationStatus } from '../models/Doctor';
import { DoctorDocument } from '../models/DoctorDocument';
import { AuditLogService } from './AuditLogService';

async function loadDoctorOr404(id: string) {
  const doctor = await Doctor.findById(id);
  if (!doctor) {
    throw { status: 404, message: 'Doctor not found', isOperational: true };
  }
  return doctor;
}

function invalidTransition(from: DoctorVerificationStatus, action: string) {
  throw {
    status: 400,
    message: `Cannot ${action} a doctor with status ${from}.`,
    isOperational: true,
  };
}

export class AdminDoctorService {
  private auditLogService = new AuditLogService();

  async listPending() {
    return Doctor.find({ verificationStatus: 'PENDING' }).sort({ createdAt: 1 });
  }

  async listAll(filters: { status?: string; region?: string; specialization?: string }) {
    const query: Record<string, unknown> = {};
    if (filters.status) query.verificationStatus = filters.status;
    if (filters.region) query.region = new RegExp(`^${filters.region}$`, 'i');
    if (filters.specialization) query.specialization = new RegExp(filters.specialization, 'i');
    return Doctor.find(query).sort({ createdAt: -1 });
  }

  async getFullDetail(id: string) {
    const doctor = await loadDoctorOr404(id);
    const documents = await DoctorDocument.find({ doctorId: doctor._id });
    return { ...doctor.toObject(), documents };
  }

  async approve(adminId: string, id: string) {
    const doctor = await loadDoctorOr404(id);
    if (doctor.verificationStatus !== 'PENDING') invalidTransition(doctor.verificationStatus, 'approve');

    const previousStatus = doctor.verificationStatus;
    doctor.verificationStatus = 'VERIFIED';
    doctor.verifiedBy = adminId as any;
    doctor.verifiedAt = new Date();
    doctor.statusReason = undefined;
    await doctor.save();

    await this.auditLogService.record({
      actorId: adminId,
      action: 'DOCTOR_VERIFIED',
      targetType: 'Doctor',
      targetId: String(doctor._id),
      previousStatus,
      newStatus: 'VERIFIED',
    });

    return doctor;
  }

  async reject(adminId: string, id: string, reason: string) {
    const doctor = await loadDoctorOr404(id);
    if (doctor.verificationStatus !== 'PENDING') invalidTransition(doctor.verificationStatus, 'reject');
    return this.transitionWithReason(adminId, doctor, 'REJECTED', 'DOCTOR_REJECTED', reason);
  }

  async suspend(adminId: string, id: string, reason: string) {
    const doctor = await loadDoctorOr404(id);
    if (doctor.verificationStatus !== 'VERIFIED') invalidTransition(doctor.verificationStatus, 'suspend');
    return this.transitionWithReason(adminId, doctor, 'SUSPENDED', 'DOCTOR_SUSPENDED', reason);
  }

  async revoke(adminId: string, id: string, reason: string) {
    const doctor = await loadDoctorOr404(id);
    if (doctor.verificationStatus !== 'VERIFIED' && doctor.verificationStatus !== 'SUSPENDED') {
      invalidTransition(doctor.verificationStatus, 'revoke');
    }
    return this.transitionWithReason(adminId, doctor, 'REVOKED', 'DOCTOR_REVOKED', reason);
  }

  private async transitionWithReason(
    adminId: string,
    doctor: Awaited<ReturnType<typeof loadDoctorOr404>>,
    newStatus: DoctorVerificationStatus,
    action: string,
    reason: string
  ) {
    const previousStatus = doctor.verificationStatus;
    doctor.verificationStatus = newStatus;
    doctor.statusReason = reason;
    await doctor.save();

    await this.auditLogService.record({
      actorId: adminId,
      action,
      targetType: 'Doctor',
      targetId: String(doctor._id),
      previousStatus,
      newStatus,
      reason,
    });

    return doctor;
  }

  async listAuditLogs(doctorId: string) {
    return this.auditLogService.list({ targetType: 'Doctor', targetId: doctorId });
  }
}
