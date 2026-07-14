import { Schema, model } from 'mongoose';

const OrderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true }, // Optional to support Guest Checkouts
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    selectedSize: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 }
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 }, // loyalty points redeemed
  pointsRedeemed: { type: Number, default: 0 },
  pointsEarned: { type: Number, default: 0 },
  tax: { type: Number, required: true },
  shipping: { type: Number, default: 0 },
  payable: { type: Number, required: true },
  status: { type: String, enum: ['Ordered', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Return Approved', 'Refund Initiated', 'Refund Completed'], default: 'Ordered' },
  timeline: [{
    label: { type: String, required: true },
    date: { type: String, default: '' },
    desc: { type: String, default: '' },
    active: { type: Boolean, default: false }
  }],
  paymentMethod: { type: String, enum: ['razorpay', 'netbanking', 'cod'], required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true }, // Required to sync guest orders
    email: { type: String, required: true }, // Required to sync guest orders
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pin: { type: String, required: true }
  },
  returnDetails: {
    reason: { type: String, default: '' },
    description: { type: String, default: '' },
    photos: [{ type: String }],
    status: { type: String, default: '' },
    requestDate: { type: Date, default: null }
  },
  courierName: { type: String, default: '' },
  trackingNumber: { type: String, default: '' }
}, { timestamps: true });

export default model('Order', OrderSchema);
