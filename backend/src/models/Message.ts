import { Schema, model } from 'mongoose';

const MessageSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  phone: { type: String, default: '' },
  subject: { type: String, default: 'General Inquiry' },
  message: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  replies: [{ type: String }],
  replyDate: { type: Date, default: null }
}, { timestamps: true });

export default model('Message', MessageSchema);
