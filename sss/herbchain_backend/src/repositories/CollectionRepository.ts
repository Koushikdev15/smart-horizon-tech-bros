import { CollectionEvent, ICollectionEvent } from '../models/CollectionEvent';

export class CollectionRepository {
  async create(data: Partial<ICollectionEvent>): Promise<ICollectionEvent> {
    const event = new CollectionEvent(data);
    return event.save();
  }

  async updateTxHash(id: string, txHash: string): Promise<ICollectionEvent | null> {
    return CollectionEvent.findByIdAndUpdate(id, { fabricTxHash: txHash }, { new: true });
  }

  async findAll(): Promise<ICollectionEvent[]> {
    return CollectionEvent.find().populate('farmerId', 'name email').sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<ICollectionEvent | null> {
    return CollectionEvent.findById(id).populate('farmerId', 'name email');
  }
}
