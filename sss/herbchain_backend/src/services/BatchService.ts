import { Batch, IBatch } from '../models/Batch';
import { CollectionEvent } from '../models/CollectionEvent';
import { FabricService } from '../integrations/fabric/FabricService';
import logger from '../utils/logger';

export class BatchService {
  private fabricService = new FabricService();

  async createBatch(centerId: string, collectionIds: string[]) {
    // Verify all collections exist, are pending, and share the same species
    const collections = await CollectionEvent.find({ _id: { $in: collectionIds }, status: 'Pending' });
    if (collections.length !== collectionIds.length) {
      throw { status: 400, message: 'Invalid or already approved collection IDs provided', isOperational: true };
    }

    const species = collections[0].species;
    const allSameSpecies = collections.every(c => c.species === species);
    if (!allSameSpecies) {
      throw { status: 400, message: 'All collections in a batch must be of the same species', isOperational: true };
    }

    const totalQuantity = collections.reduce((acc, curr) => acc + curr.quantity, 0);

    const batch = new Batch({
      collectionIds,
      species,
      totalQuantity,
      centerId
    });

    const savedBatch = await batch.save();

    // Update Collections to Approved
    await CollectionEvent.updateMany(
      { _id: { $in: collectionIds } },
      { $set: { status: 'Approved' } }
    );

    // Call Fabric
    try {
      const txHash = await this.fabricService.CreateBatch({
        batchId: savedBatch._id,
        collectionIds,
        species,
        totalQuantity,
        timestamp: new Date().toISOString()
      });
      savedBatch.fabricTxHash = txHash;
      await savedBatch.save();
    } catch (fabricError) {
      logger.error('Failed to commit Batch to Fabric, but saved in Mongo', fabricError);
    }

    if ((global as any).io) {
      (global as any).io.emit('BatchCreated', savedBatch);
    }

    return savedBatch;
  }

  async getAllBatches() {
    return Batch.find().populate('collectionIds centerId');
  }
}
