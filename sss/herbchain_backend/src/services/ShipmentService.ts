import { Shipment } from '../models/Shipment';
import { FabricService } from '../integrations/fabric/FabricService';

export class ShipmentService {
  private fabricService = new FabricService();

  async createShipment(originId: string, data: any) {
    const shipment = new Shipment({
      productId: data.productId,
      originId,
      destinationId: data.destinationId,
      currentLocation: data.currentLocation
    });

    const savedShipment = await shipment.save();

    try {
      const txHash = await this.fabricService.ShipmentUpdate(savedShipment._id.toString(), data);
      savedShipment.fabricTxHash = txHash;
      await savedShipment.save();
    } catch (err) {}

    return savedShipment;
  }
}
