import { Schema, model } from 'mongoose';

const BlogSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  category: { type: String, required: true },
  summary: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String, required: true },
  author: { type: String, default: 'Kalankari Editorial' },
  publishedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default model('Blog', BlogSchema);
