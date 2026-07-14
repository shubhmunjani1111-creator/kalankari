import { Schema, model } from 'mongoose';

const ReviewSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true }, // Optional to support reviews before/after guest accounts link
  author: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true },
  desc: { type: String, required: true },
  photos: [{ type: String }], // URLs of uploaded reviewer photos
  verified: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

export default model('Review', ReviewSchema);
