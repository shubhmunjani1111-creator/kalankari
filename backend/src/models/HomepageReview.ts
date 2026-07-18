import { Schema, model } from 'mongoose';

const HomepageReviewSchema = new Schema({
  reviewId: { type: Schema.Types.ObjectId, ref: 'Review', required: true, unique: true },
  order: { type: Number, default: 0 },
  pinned: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true }
}, { timestamps: true });

export default model('HomepageReview', HomepageReviewSchema);
