import { HealthProfile, IHealthProfile } from '../models/HealthProfile';

export class HealthProfileService {
  async getByUserId(userId: string): Promise<IHealthProfile | null> {
    return HealthProfile.findOne({ userId });
  }

  /**
   * Creates or updates the caller's own health profile. Withdrawing storage
   * consent (consentStoreHealthData: false) erases the record entirely rather
   * than leaving stale health data behind with a flag turned off.
   */
  async upsert(userId: string, data: Partial<IHealthProfile>): Promise<IHealthProfile | null> {
    if (data.consentStoreHealthData === false) {
      await HealthProfile.deleteOne({ userId });
      return null;
    }

    return HealthProfile.findOneAndUpdate(
      { userId },
      { $set: { ...data, userId } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }

  async deleteByUserId(userId: string): Promise<void> {
    await HealthProfile.deleteOne({ userId });
  }
}
