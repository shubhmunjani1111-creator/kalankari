import { Schema, model } from 'mongoose';

const EmailLogSchema = new Schema({
  recipient: { type: String, required: true, index: true },
  subject: { type: String, required: true },
  type: { type: String, required: true, index: true }, // welcome, admin_order, customer_order, status_shipped, status_delivered, password_reset
  status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'pending', index: true },
  provider: { type: String, required: true }, // resend, brevo, mock
  providerResponse: { type: String },
  attempts: { type: Number, default: 0 },
  errorMsg: { type: String },
  metadata: { type: Schema.Types.Mixed } // Stores associated Order ID or User ID
}, { timestamps: true });

export default model('EmailLog', EmailLogSchema);
