import { ProductInventory } from '../models/ProductInventory';
import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { supabaseAdmin } from '../lib/supabaseAdmin';

interface CartItemInput {
  productId: string;
  storeId: string;
  quantity: number;
}

/**
 * Orders live in Supabase (public.customer_orders / customer_order_items —
 * see herbchain_app/supabase/migrations/0006_customer_orders.sql), written
 * here with the service-role key after re-resolving every item against the
 * live MongoDB product/store catalog, which stays in Mongo — it's owned by
 * the Manufacturer/Store-owner roles herbchain_web serves, out of scope for
 * the customer-data migration. userId is the Supabase auth.users UUID.
 */
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
        product_id: String(product._id),
        product_name: product.productName,
        store_id: String(store._id),
        store_name: store.name,
        quantity: item.quantity,
        unit_price: inventory.price,
      });
    }

    const totalAmount = resolvedItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

    // Online payment gateway isn't wired up yet — see AyurTrace+ README/setup
    // notes. Cash on Delivery is the only path that actually completes today.
    const paymentStatus = data.paymentMethod === 'COD' ? 'COD' : 'PENDING';

    const { data: order, error: orderError } = await supabaseAdmin
      .from('customer_orders')
      .insert({
        user_id: userId,
        total_amount: totalAmount,
        delivery_address: data.deliveryAddress,
        region: data.region,
        payment_method: data.paymentMethod,
        payment_status: paymentStatus,
      })
      .select('*')
      .single();

    if (orderError || !order) {
      throw { status: 500, message: 'Could not place your order. Please try again.', isOperational: true };
    }

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('customer_order_items')
      .insert(resolvedItems.map((item) => ({ ...item, order_id: order.id })))
      .select('*');

    if (itemsError) {
      // Order row exists but items failed — roll it back so we don't leave a
      // total with nothing behind it.
      await supabaseAdmin.from('customer_orders').delete().eq('id', order.id);
      throw { status: 500, message: 'Could not place your order. Please try again.', isOperational: true };
    }

    // Best-effort stock decrement — not wrapped in a distributed transaction;
    // fine at this scale, but a high-concurrency deployment would need one.
    for (const item of data.items) {
      await ProductInventory.updateOne(
        { productId: item.productId, storeId: item.storeId, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } }
      );
    }

    return toOrderResponse(order, items ?? []);
  }

  async getOwn(userId: string) {
    const { data: orders, error } = await supabaseAdmin
      .from('customer_orders')
      .select('*, customer_order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw { status: 500, message: 'Could not load your orders.', isOperational: true };
    }

    return (orders ?? []).map((o: any) => toOrderResponse(o, o.customer_order_items ?? []));
  }

  async getOwnById(userId: string, id: string) {
    const { data: order, error } = await supabaseAdmin
      .from('customer_orders')
      .select('*, customer_order_items(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !order) {
      throw { status: 404, message: 'Order not found', isOperational: true };
    }

    return toOrderResponse(order, order.customer_order_items ?? []);
  }
}

function toOrderResponse(order: Record<string, any>, items: Record<string, any>[]) {
  return {
    id: order.id,
    items: items.map((i) => ({
      productId: i.product_id,
      productName: i.product_name,
      storeId: i.store_id,
      storeName: i.store_name,
      quantity: i.quantity,
      unitPrice: Number(i.unit_price),
    })),
    totalAmount: Number(order.total_amount),
    deliveryAddress: order.delivery_address,
    region: order.region,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    orderStatus: order.order_status,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}
