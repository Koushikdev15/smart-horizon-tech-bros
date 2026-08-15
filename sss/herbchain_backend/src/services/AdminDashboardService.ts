import { Doctor } from '../models/Doctor';
import { DoctorGuidanceVersion } from '../models/DoctorGuidanceVersion';
import { ChatMessage } from '../models/ChatMessage';
import { Complaint } from '../models/Complaint';

export class AdminDashboardService {
  async getStats() {
    const [
      pendingDoctors,
      verifiedDoctors,
      suspendedDoctors,
      revokedDoctors,
      rejectedDoctors,
      pendingGuidance,
      publishedGuidance,
      rejectedGuidance,
      aiSafetyAlerts,
      openComplaints,
      totalComplaints,
    ] = await Promise.all([
      Doctor.countDocuments({ verificationStatus: 'PENDING' }),
      Doctor.countDocuments({ verificationStatus: 'VERIFIED' }),
      Doctor.countDocuments({ verificationStatus: 'SUSPENDED' }),
      Doctor.countDocuments({ verificationStatus: 'REVOKED' }),
      Doctor.countDocuments({ verificationStatus: 'REJECTED' }),
      DoctorGuidanceVersion.countDocuments({ status: 'SUBMITTED' }),
      DoctorGuidanceVersion.countDocuments({ status: 'PUBLISHED' }),
      DoctorGuidanceVersion.countDocuments({ status: 'REJECTED' }),
      ChatMessage.countDocuments({ category: { $in: ['URGENT_MEDICAL_ATTENTION', 'POTENTIAL_ALLERGY_CONFLICT'] } }),
      Complaint.countDocuments({ status: 'OPEN' }),
      Complaint.countDocuments({}),
    ]);

    return {
      doctors: { pending: pendingDoctors, verified: verifiedDoctors, suspended: suspendedDoctors, revoked: revokedDoctors, rejected: rejectedDoctors },
      guidance: { pending: pendingGuidance, published: publishedGuidance, rejected: rejectedGuidance },
      aiSafetyAlerts,
      complaints: { open: openComplaints, total: totalComplaints },
    };
  }
}
