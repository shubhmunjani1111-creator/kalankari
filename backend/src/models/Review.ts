import { Schema, model } from 'mongoose';

const ReviewSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, default: '' },
  review: { type: String, required: true },
  images: [{ type: String }],
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Hidden'], default: 'Pending', index: true },
  featured: { type: Boolean, default: false, index: true }
}, { timestamps: true });

export default model('Review', ReviewSchema);
