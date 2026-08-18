import { Doctor } from '../models/Doctor';
import { DoctorGuidanceVersion } from '../models/DoctorGuidanceVersion';
import { supabaseAdmin } from '../lib/supabaseAdmin';

// Complaints and chat messages now live in Supabase (customer_complaints /
// customer_chat_messages) — see herbchain_app/supabase/migrations.
async function countSupabase(table: string, filter?: (q: any) => any) {
  let query = supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
  if (filter) query = filter(query);
  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

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
      countSupabase('customer_chat_messages', (q) =>
        q.in('category', ['URGENT_MEDICAL_ATTENTION', 'POTENTIAL_ALLERGY_CONFLICT'])
      ),
      countSupabase('customer_complaints', (q) => q.eq('status', 'OPEN')),
      countSupabase('customer_complaints'),
    ]);

    return {
      doctors: { pending: pendingDoctors, verified: verifiedDoctors, suspended: suspendedDoctors, revoked: revokedDoctors, rejected: rejectedDoctors },
      guidance: { pending: pendingGuidance, published: publishedGuidance, rejected: rejectedGuidance },
      aiSafetyAlerts,
      complaints: { open: openComplaints, total: totalComplaints },
    };
  }
}
