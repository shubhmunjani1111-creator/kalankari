import { Schema, model } from 'mongoose';

const SMSLogSchema = new Schema({
  recipient: { type: String, required: true, index: true },
  body: { type: String, required: true },
  status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'pending', index: true },
  providerResponse: { type: String },
  errorMsg: { type: String }
}, { timestamps: true });

export default model('SMSLog', SMSLogSchema);
