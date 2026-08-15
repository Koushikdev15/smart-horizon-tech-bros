import { Doctor } from '../models/Doctor';
import { DoctorGuidance } from '../models/DoctorGuidance';
import { DoctorGuidanceVersion } from '../models/DoctorGuidanceVersion';
import { AuditLogService } from './AuditLogService';

async function loadSubmittedVersionOr404(versionId: string) {
  const version = await DoctorGuidanceVersion.findById(versionId);
  if (!version) {
    throw { status: 404, message: 'Guidance version not found', isOperational: true };
  }
  return version;
}

export class AdminDoctorGuidanceService {
  private auditLogService = new AuditLogService();

  async listSubmitted() {
    return DoctorGuidanceVersion.find({ status: 'SUBMITTED' }).sort({ submittedAt: 1 });
  }

  async getVersionDetail(versionId: string) {
    const version = await loadSubmittedVersionOr404(versionId);
    const guidance = await DoctorGuidance.findById(version.guidanceId);
    const doctor = guidance ? await Doctor.findById(guidance.doctorId) : null;
    return { version, guidance, doctor };
  }

  async approve(adminId: string, versionId: string) {
    const version = await loadSubmittedVersionOr404(versionId);
    if (version.status !== 'SUBMITTED') {
      throw { status: 400, message: `Cannot approve a version with status ${version.status}.`, isOperational: true };
    }

    const guidance = await DoctorGuidance.findById(version.guidanceId);
    if (!guidance) {
      throw { status: 404, message: 'Guidance not found', isOperational: true };
    }
    const doctor = await Doctor.findById(guidance.doctorId);
    if (!doctor || doctor.verificationStatus !== 'VERIFIED') {
      throw {
        status: 400,
        message: 'This guidance was authored by a doctor who is no longer verified — cannot publish.',
        isOperational: true,
      };
    }

    const previousStatus = version.status;
    version.status = 'PUBLISHED';
    version.approvedBy = adminId as any;
    version.approvedAt = new Date();
    version.publishedAt = new Date();
    await version.save();

    guidance.currentPublishedVersion = version._id as any;
    await guidance.save();

    await this.auditLogService.record({
      actorId: adminId,
      action: 'GUIDANCE_PUBLISHED',
      targetType: 'DoctorGuidanceVersion',
      targetId: String(version._id),
      previousStatus,
      newStatus: 'PUBLISHED',
    });

    return version;
  }

  async reject(adminId: string, versionId: string, reason: string) {
    const version = await loadSubmittedVersionOr404(versionId);
    if (version.status !== 'SUBMITTED') {
      throw { status: 400, message: `Cannot reject a version with status ${version.status}.`, isOperational: true };
    }

    const previousStatus = version.status;
    version.status = 'REJECTED';
    version.rejectionReason = reason;
    version.approvedBy = adminId as any;
    version.approvedAt = new Date();
    await version.save();

    await this.auditLogService.record({
      actorId: adminId,
      action: 'GUIDANCE_REJECTED',
      targetType: 'DoctorGuidanceVersion',
      targetId: String(version._id),
      previousStatus,
      newStatus: 'REJECTED',
      reason,
    });

    return version;
  }
}
