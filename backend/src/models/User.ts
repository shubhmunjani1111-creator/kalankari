import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  loyaltyPoints: { type: Number, default: 0 },
  dob: { type: Date, default: null },
  gender: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Deactivated'], default: 'Active' },
  avatar: { type: String, default: '' },
  tempEmail: { type: String, default: '' },
  emailOTP: { type: String, default: '' },
  emailOTPExpires: { type: Date, default: null },
  tempMobile: { type: String, default: '' },
  mobileOTP: { type: String, default: '' },
  mobileOTPExpires: { type: Date, default: null },
  forgotOTP: { type: String, default: '' },
  forgotOTPExpires: { type: Date, default: null },
  forgotOTPAttempts: { type: Number, default: 0 },
  recentlyViewed: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  addresses: [{
    type: { type: String, default: 'Home' },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pin: { type: String, required: true }
  }],
  wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true });

export default model('User', UserSchema);
