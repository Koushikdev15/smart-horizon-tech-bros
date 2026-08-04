import { ProcessingStep } from '../models/ProcessingStep';
import { FabricService } from '../integrations/fabric/FabricService';
import { IpfsService } from '../integrations/ipfs/IpfsService';

export class ProcessingService {
  private fabricService = new FabricService();
  private ipfsService = new IpfsService();

  async addStep(batchId: string, processorId: string, data: any, reportBuffer?: Buffer) {
    let ipfsReportCid;
    if (reportBuffer) {
      ipfsReportCid = await this.ipfsService.uploadReport(reportBuffer, 'Certificate');
    }

    const step = new ProcessingStep({
      batchId,
      processorId,
      stepName: data.stepName,
      temperature: data.temperature,
      humidity: data.humidity,
      durationHours: data.durationHours,
      ipfsReportCid
    });

    const savedStep = await step.save();

    try {
      const txHash = await this.fabricService.ProcessingUpdate(batchId, {
        stepId: savedStep._id,
        stepName: data.stepName,
        timestamp: new Date().toISOString()
      });
      savedStep.fabricTxHash = txHash;
      await savedStep.save();
    } catch (err) {}

    return savedStep;
  }
}
