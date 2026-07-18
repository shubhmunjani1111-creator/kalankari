import Order from '../models/Order';
import { getNextOrderNumber } from '../models/Counter';

export const migrateOrderNumbers = async () => {
  try {
    const ordersWithoutNumber = await Order.find({
      $or: [
        { orderNumber: { $exists: false } },
        { orderNumber: '' },
        { orderNumber: null }
      ]
    }).sort({ createdAt: 1 });

    if (ordersWithoutNumber.length === 0) {
      console.log('[MIGRATION] All orders already have an orderNumber. Skipping.');
      return;
    }

    console.log(`[MIGRATION] Found ${ordersWithoutNumber.length} orders without an orderNumber. Starting migration...`);
    
    for (const order of ordersWithoutNumber) {
      const year = new Date(order.createdAt).getFullYear();
      const orderNumber = await getNextOrderNumber(year);
      order.orderNumber = orderNumber;
      await order.save();
      console.log(`[MIGRATION] Migrated Order ${order._id} -> ${orderNumber}`);
    }

    console.log('[MIGRATION] Order number migration completed successfully.');
  } catch (err) {
    console.error('[MIGRATION] Order number migration failed:', err);
  }
};
