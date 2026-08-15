import { Order } from '../models/Order';
import { ProductInventory } from '../models/ProductInventory';
import { Product } from '../models/Product';
import { Store } from '../models/Store';

interface CartItemInput {
  productId: string;
  storeId: string;
  quantity: number;
}

export class OrderService {
  /**
   * Every item is re-resolved against the live ProductInventory record —
   * price, product name, and store name are never taken from the client, so
   * a tampered request can't under-pay or reference a product/store that
   * doesn't actually stock together.
   */
  async placeOrder(
    userId: string,
    data: { items: CartItemInput[]; deliveryAddress: string; region: string; paymentMethod: 'COD' | 'ONLINE' }
  ) {
    if (!data.items?.length) {
      throw { status: 400, message: 'Your cart is empty.', isOperational: true };
    }

    const resolvedItems = [];
    for (const item of data.items) {
      const inventory = await ProductInventory.findOne({ productId: item.productId, storeId: item.storeId, available: true });
      if (!inventory || inventory.price == null) {
        throw { status: 400, message: 'One of the items in your cart is no longer available. Please refresh and try again.', isOperational: true };
      }
      if (inventory.quantity != null && inventory.quantity < item.quantity) {
        throw { status: 400, message: `Only ${inventory.quantity} unit(s) left in stock for one of your items.`, isOperational: true };
      }

      const [product, store] = await Promise.all([Product.findById(item.productId), Store.findById(item.storeId)]);
      if (!product || !store) {
        throw { status: 404, message: 'A product or store in your cart no longer exists.', isOperational: true };
      }

      resolvedItems.push({
        productId: product._id,
        productName: product.productName,
        storeId: store._id,
        storeName: store.name,
        quantity: item.quantity,
        unitPrice: inventory.price,
      });
    }

    const totalAmount = resolvedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    // Online payment gateway isn't wired up yet — see AyurTrace+ README/setup
    // notes. Cash on Delivery is the only path that actually completes today.
    const paymentStatus = data.paymentMethod === 'COD' ? 'COD' : 'PENDING';

    const order = await Order.create({
      userId,
      items: resolvedItems,
      totalAmount,
      deliveryAddress: data.deliveryAddress,
      region: data.region,
      paymentMethod: data.paymentMethod,
      paymentStatus,
    });

    // Best-effort stock decrement — not wrapped in a distributed transaction;
    // fine at this scale, but a high-concurrency deployment would need one.
    for (const item of data.items) {
      await ProductInventory.updateOne(
        { productId: item.productId, storeId: item.storeId, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } }
      );
    }

    return order;
  }

  async getOwn(userId: string) {
    return Order.find({ userId }).sort({ createdAt: -1 });
  }

  async getOwnById(userId: string, id: string) {
    const order = await Order.findOne({ _id: id, userId });
    if (!order) {
      throw { status: 404, message: 'Order not found', isOperational: true };
    }
    return order;
  }
}
