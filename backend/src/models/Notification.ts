import { Schema, model } from 'mongoose';

const NotificationSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  email: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  sent: { type: Boolean, default: false },
  sentAt: { type: Date, default: null }
}, { timestamps: true });

export default model('Notification', NotificationSchema);
