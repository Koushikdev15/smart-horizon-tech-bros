import logger from '../../utils/logger';

export class IpfsService {
  async uploadImage(imageBuffer: Buffer): Promise<string> {
    const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}XyZ${Math.random().toString(36).substring(2, 15)}`;
    logger.info(`[IPFS Service] Uploaded image. CID: ${mockCid}`);
    return mockCid;
  }

  async uploadReport(documentBuffer: Buffer, reportType: 'DNA' | 'HeavyMetal' | 'Pesticide' | 'Certificate'): Promise<string> {
    const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}Rpt${Math.random().toString(36).substring(2, 15)}`;
    logger.info(`[IPFS Service] Uploaded ${reportType} report. CID: ${mockCid}`);
    return mockCid;
  }

  /**
   * Generic document upload (doctor licenses/certifications, profile photos, etc).
   * NOTE: same as uploadImage/uploadReport above — this is a mock. The buffer is
   * never persisted anywhere; the returned "CID" is a random string, not a real
   * IPFS reference, so nothing uploaded through this service is retrievable yet.
   * Swap this class for a real IPFS/S3 client before relying on it in production.
   */
  async uploadDocument(documentBuffer: Buffer, label: string): Promise<string> {
    const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}Doc${Math.random().toString(36).substring(2, 15)}`;
    logger.info(`[IPFS Service] Uploaded ${label} document. CID: ${mockCid}`);
    return mockCid;
  }
}
