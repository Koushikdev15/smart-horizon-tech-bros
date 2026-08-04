import { Product } from '../models/Product';
import { FabricService } from '../integrations/fabric/FabricService';

export class ManufacturingService {
  private fabricService = new FabricService();

  async createProduct(manufacturerId: string, data: any) {
    const product = new Product({
      productName: data.productName,
      batchIds: data.batchIds,
      manufacturerId,
      qrCode: `HERB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    });

    const savedProduct = await product.save();

    try {
      const txHash = await this.fabricService.ManufacturingUpdate(savedProduct._id.toString(), data.batchIds);
      savedProduct.fabricTxHash = txHash;
      await savedProduct.save();
    } catch (err) {}

    return savedProduct;
  }
}
