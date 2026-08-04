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
}
