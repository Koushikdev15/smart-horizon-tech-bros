import { CollectionRepository } from '../repositories/CollectionRepository';
import { AiService } from '../integrations/ai/AiService';
import { IpfsService } from '../integrations/ipfs/IpfsService';
import { FabricService } from '../integrations/fabric/FabricService';
import logger from '../utils/logger';
import mongoose from 'mongoose';

export class CollectionService {
  private repo = new CollectionRepository();
  private aiService = new AiService();
  private ipfsService = new IpfsService();
  private fabricService = new FabricService();

  async submitCollection(farmerId: string, data: any, imageBuffer: Buffer) {
    // 1. AI Verification
    const speciesResult = await this.aiService.verifySpecies(imageBuffer, data.species);
    if (!speciesResult.success || speciesResult.confidence < 0.8) {
      throw { status: 400, message: 'AI Verification Failed: Species mismatch or low confidence', isOperational: true };
    }

    const isDuplicate = await this.aiService.verifyDuplicate(imageBuffer);
    if (isDuplicate) {
      throw { status: 400, message: 'AI Verification Failed: Duplicate image detected', isOperational: true };
    }

    const gpsValid = await this.aiService.verifyGPS(data.latitude, data.longitude, 'Expected Region based on species');
    if (!gpsValid) {
      throw { status: 400, message: 'AI Verification Failed: GPS coordinates do not match expected growing region', isOperational: true };
    }

    // 2. IPFS Upload
    const ipfsCid = await this.ipfsService.uploadImage(imageBuffer);

    // 3. Save to MongoDB
    const collectionData = {
      farmerId: new mongoose.Types.ObjectId(farmerId),
      species: data.species,
      quantity: data.quantity,
      latitude: data.latitude,
      longitude: data.longitude,
      ipfsImageCid: ipfsCid
    };
    const savedEvent = await this.repo.create(collectionData);

    // 4. Fabric CreateCollection
    try {
      const txHash = await this.fabricService.CreateCollection({
        id: savedEvent._id.toString(),
        ...collectionData,
        timestamp: new Date().toISOString()
      });
      await this.repo.updateTxHash(savedEvent._id.toString(), txHash);
      savedEvent.fabricTxHash = txHash;
    } catch (fabricError) {
      logger.error('Failed to commit to Fabric, but saved in Mongo', fabricError);
      // In a real system, you'd have a retry mechanism or saga pattern
    }

    // 5. Emit Socket Event
    if ((global as any).io) {
      (global as any).io.emit('CollectionSubmitted', savedEvent);
    }

    return savedEvent;
  }

  async getAllCollections() {
    return this.repo.findAll();
  }

  async getCollectionById(id: string) {
    const event = await this.repo.findById(id);
    if (!event) throw { status: 404, message: 'Collection event not found', isOperational: true };
    return event;
  }
}
