import { Doctor } from '../models/Doctor';
import { DoctorGuidance, IDoctorGuidance } from '../models/DoctorGuidance';
import { DoctorGuidanceVersion, IDoctorGuidanceVersion } from '../models/DoctorGuidanceVersion';
import { AuditLogService } from './AuditLogService';

const VERSION_CONTENT_FIELDS = [
  'title', 'healthTopic', 'productId', 'relevantIngredients', 'description',
  'traditionalContext', 'recommendedUsage', 'precautions', 'contraindications',
  'interactions', 'ageConsiderations', 'specialPopulationWarnings', 'whenToConsultDoctor',
  'region', 'state', 'district', 'country', 'language', 'references',
] as const;

function pickContentFields(source: any) {
  const picked: Record<string, unknown> = {};
  for (const field of VERSION_CONTENT_FIELDS) {
    if (source[field] !== undefined) picked[field] = source[field];
  }
  return picked;
}

const DOCTOR_PUBLIC_FIELDS = 'name qualification specialization clinic region state country languages verificationStatus verifiedAt';

async function findOwnDoctorOr403(userId: string) {
  const doctor = await Doctor.findOne({ userId });
  if (!doctor) {
    throw { status: 403, message: 'You must have a doctor profile to manage guidance.', isOperational: true };
  }
  return doctor;
}

async function loadGuidanceOwnedByOr404(guidanceId: string, doctorId: string) {
  const guidance = await DoctorGuidance.findOne({ _id: guidanceId, doctorId });
  if (!guidance) {
    throw { status: 404, message: 'Guidance not found', isOperational: true };
  }
  return guidance;
}

export class DoctorGuidanceService {
  private auditLogService = new AuditLogService();

  async createDraft(userId: string, data: any) {
    const doctor = await findOwnDoctorOr403(userId);

    const guidance = await DoctorGuidance.create({
      doctorId: doctor._id,
      productId: data.productId as string | undefined,
      healthTopic: data.healthTopic as string,
      latestVersionNumber: 1,
    });

    const version = await DoctorGuidanceVersion.create({
      guidanceId: guidance._id,
      version: 1,
      status: 'DRAFT',
      createdBy: userId,
      ...pickContentFields(data),
    });

    await this.auditLogService.record({
      actorId: userId,
      action: 'GUIDANCE_DRAFT_CREATED',
      targetType: 'DoctorGuidanceVersion',
      targetId: String(version._id),
      newStatus: 'DRAFT',
    });

    return { guidance, version };
  }

  async createNewVersion(userId: string, guidanceId: string, data: any) {
    const doctor = await findOwnDoctorOr403(userId);
    const guidance = await loadGuidanceOwnedByOr404(guidanceId, String(doctor._id));

    const latestVersion = await DoctorGuidanceVersion.findOne({ guidanceId: guidance._id }).sort({ version: -1 });
    const nextVersionNumber = guidance.latestVersionNumber + 1;

    const baseContent = latestVersion ? pickContentFields(latestVersion.toObject()) : {};
    const version = await DoctorGuidanceVersion.create({
      guidanceId: guidance._id,
      version: nextVersionNumber,
      status: 'DRAFT',
      createdBy: userId,
      ...baseContent,
      ...pickContentFields(data),
    });

    guidance.latestVersionNumber = nextVersionNumber;
    if (data.healthTopic) guidance.healthTopic = data.healthTopic as string;
    if (data.productId) guidance.productId = data.productId as any;
    await guidance.save();

    await this.auditLogService.record({
      actorId: userId,
      action: 'GUIDANCE_NEW_VERSION_CREATED',
      targetType: 'DoctorGuidanceVersion',
      targetId: String(version._id),
      newStatus: 'DRAFT',
      metadata: { guidanceId: String(guidance._id), version: nextVersionNumber },
    });

    return { guidance, version };
  }

  async submit(userId: string, versionId: string) {
    const doctor = await findOwnDoctorOr403(userId);

    const version = await DoctorGuidanceVersion.findById(versionId);
    if (!version) {
      throw { status: 404, message: 'Guidance version not found', isOperational: true };
    }
    const guidance = await DoctorGuidance.findOne({ _id: version.guidanceId, doctorId: doctor._id });
    if (!guidance) {
      throw { status: 404, message: 'Guidance version not found', isOperational: true };
    }
    if (version.status !== 'DRAFT') {
      throw { status: 400, message: `Cannot submit a version with status ${version.status}.`, isOperational: true };
    }
    if (doctor.verificationStatus !== 'VERIFIED') {
      throw {
        status: 403,
        message: 'Only verified doctors can submit guidance for review.',
        isOperational: true,
      };
    }

    const previousStatus = version.status;
    version.status = 'SUBMITTED';
    version.submittedAt = new Date();
    await version.save();

    await this.auditLogService.record({
      actorId: userId,
      action: 'GUIDANCE_SUBMITTED',
      targetType: 'DoctorGuidanceVersion',
      targetId: String(version._id),
      previousStatus,
      newStatus: 'SUBMITTED',
    });

    return version;
  }

  async listOwn(userId: string) {
    const doctor = await findOwnDoctorOr403(userId);
    const guidanceList = await DoctorGuidance.find({ doctorId: doctor._id }).sort({ updatedAt: -1 });
    return Promise.all(
      guidanceList.map(async (g) => {
        const latestVersion = await DoctorGuidanceVersion.findOne({ guidanceId: g._id }).sort({ version: -1 });
        return { guidance: g, latestVersion };
      })
    );
  }

  async getOwnVersionHistory(userId: string, guidanceId: string) {
    const doctor = await findOwnDoctorOr403(userId);
    const guidance = await loadGuidanceOwnedByOr404(guidanceId, String(doctor._id));
    const versions = await DoctorGuidanceVersion.find({ guidanceId: guidance._id }).sort({ version: 1 });
    return { guidance, versions };
  }

  /**
   * Customer-facing search. Only ever returns PUBLISHED content authored by a
   * doctor who is STILL currently VERIFIED — a doctor suspended/revoked after
   * publishing must stop being surfaced as an active trusted source, even
   * though the version record itself is kept for audit history.
   */
  async findPublished(filters: { productId?: string; healthTopic?: string; region?: string; country?: string; language?: string }) {
    const query: Record<string, unknown> = { status: 'PUBLISHED' };
    if (filters.productId) query.productId = filters.productId;
    if (filters.healthTopic) query.healthTopic = new RegExp(filters.healthTopic, 'i');
    if (filters.language) query.language = filters.language;

    const versions = await DoctorGuidanceVersion.find(query).sort({ publishedAt: -1 }).limit(100);
    const results = await this.attachDoctorAndFilterVerified(versions);
    return this.rankByRegion(results, filters.region, filters.country);
  }

  async getPublishedByGuidanceId(guidanceId: string) {
    const guidance = await DoctorGuidance.findById(guidanceId);
    if (!guidance || !guidance.currentPublishedVersion) {
      throw { status: 404, message: 'No published guidance found', isOperational: true };
    }
    const version = await DoctorGuidanceVersion.findOne({
      _id: guidance.currentPublishedVersion,
      status: 'PUBLISHED',
    });
    if (!version) {
      throw { status: 404, message: 'No published guidance found', isOperational: true };
    }
    const [attached] = await this.attachDoctorAndFilterVerified([version]);
    if (!attached) {
      throw { status: 404, message: 'No published guidance found', isOperational: true };
    }
    return attached;
  }

  private async attachDoctorAndFilterVerified(versions: IDoctorGuidanceVersion[]) {
    const guidanceIds = [...new Set(versions.map((v) => String(v.guidanceId)))];
    const guidances = await DoctorGuidance.find({ _id: { $in: guidanceIds } });
    const guidanceById = new Map(guidances.map((g) => [String(g._id), g]));

    const doctorIds = [...new Set(guidances.map((g) => String(g.doctorId)))];
    const doctors = await Doctor.find({ _id: { $in: doctorIds } }).select(DOCTOR_PUBLIC_FIELDS);
    const doctorById = new Map(doctors.map((d) => [String(d._id), d]));

    const attached: Array<{ version: IDoctorGuidanceVersion; guidance: IDoctorGuidance; doctor: (typeof doctors)[number] }> = [];
    for (const version of versions) {
      const guidance = guidanceById.get(String(version.guidanceId));
      if (!guidance) continue;
      const doctor = doctorById.get(String(guidance.doctorId));
      if (!doctor || doctor.verificationStatus !== 'VERIFIED') continue;
      attached.push({ version, guidance, doctor });
    }
    return attached;
  }

  /** Region match first, then country match, then everything else — never a hard filter. */
  private rankByRegion<T extends { version: IDoctorGuidanceVersion }>(items: T[], region?: string, country?: string) {
    const priority = (item: T) => {
      if (region && item.version.region?.toLowerCase() === region.toLowerCase()) return 0;
      if (country && item.version.country?.toLowerCase() === country.toLowerCase()) return 1;
      return 2;
    };
    return [...items].sort((a, b) => priority(a) - priority(b));
  }
}
