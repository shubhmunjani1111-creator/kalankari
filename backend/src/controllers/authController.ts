import { Request, Response } from 'express';
import { EmailService } from '../services/emailService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Order from '../models/Order';
import { AuthRequest } from '../middleware/auth';

const getJwtSecret = () => process.env.JWT_SECRET || 'kalankari_secret_2026';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // V2: Starting baseline is 0 points
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      loyaltyPoints: 0
    });

    await user.save();
    
    // Send welcome email (asynchronous background task, won't block response)
    EmailService.sendWelcomeEmail(user);
    
    // V2.1 Guest Order linker: sync past orders with matching email/phone to the newly created account
    await Order.updateMany(
      { user: null, $or: [{ 'shippingAddress.email': email }, { 'shippingAddress.phone': phone }] },
      { $set: { user: user._id } }
    );

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, getJwtSecret(), { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, getJwtSecret(), { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
        addresses: user.addresses
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name, gender, dob, avatar, password } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name) user.name = name;
    if (gender !== undefined) user.gender = gender;
    if (dob !== undefined) user.dob = dob ? new Date(dob) : null;
    if (avatar !== undefined) user.avatar = avatar;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      dob: user.dob,
      gender: user.gender,
      avatar: user.avatar,
      addresses: user.addresses
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const addAddress = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { type, street, city, state, pin } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.addresses.push({ type, street, city, state, pin });
    await user.save();

    res.status(201).json(user.addresses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const googleOAuthMock = async (req: Request, res: Response) => {
  try {
    const { name, email, googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({ error: 'Google authentication token is missing' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      const randPassword = await bcrypt.hash(Math.random().toString(36), 10);
      user = new User({
        name,
        email,
        password: randPassword,
        loyaltyPoints: 0
      });
      await user.save();
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, getJwtSecret(), { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        dob: user.dob,
        gender: user.gender,
        avatar: user.avatar,
        addresses: user.addresses
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllCustomersAdmin = async (req: Request, res: Response) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('-password');
    res.json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const toggleCustomerStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.status = user.status === 'Active' ? 'Deactivated' : 'Active';
    await user.save();
    res.json({ message: `User status changed to ${user.status}`, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// --- PROFILE EMAIL/MOBILE CHANGE OTP VERIFICATIONS ---

export const requestEmailOTP = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { newEmail } = req.body;
    if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
      return res.status(400).json({ error: 'Valid new email address is required.' });
    }

    const exists = await User.findOne({ email: newEmail });
    if (exists) {
      return res.status(400).json({ error: 'Email address is already registered by another account.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.tempEmail = newEmail;
    user.emailOTP = otp;
    user.emailOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    EmailService.sendEmailVerificationOTP(newEmail, otp);

    res.json({ success: true, message: 'Verification OTP has been sent to your new email address.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const confirmEmailOTP = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: 'OTP code is required.' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.tempEmail || !user.emailOTP || !user.emailOTPExpires) {
      return res.status(400).json({ error: 'No email change request is active.' });
    }

    if (new Date() > user.emailOTPExpires) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }

    if (user.emailOTP !== otp) {
      return res.status(400).json({ error: 'Invalid verification OTP code.' });
    }

    const exists = await User.findOne({ email: user.tempEmail });
    if (exists) {
      return res.status(400).json({ error: 'Email address was taken in the meantime.' });
    }

    user.email = user.tempEmail;
    user.tempEmail = '';
    user.emailOTP = '';
    user.emailOTPExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Email address updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        dob: user.dob,
        gender: user.gender,
        avatar: user.avatar
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const requestMobileOTP = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { newMobile } = req.body;
    if (!newMobile) {
      return res.status(400).json({ error: 'Valid new mobile number is required.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.tempMobile = newMobile;
    user.mobileOTP = otp;
    user.mobileOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`[VERIFICATION OTP] Mobile verification OTP for User ${user.email} (New Mobile: ${newMobile}): ${otp}`);
    EmailService.sendMobileVerificationOTP(user.email, newMobile, otp);

    res.json({ success: true, message: 'Verification OTP has been sent to your new mobile number.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const confirmMobileOTP = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: 'OTP code is required.' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.tempMobile || !user.mobileOTP || !user.mobileOTPExpires) {
      return res.status(400).json({ error: 'No mobile change request is active.' });
    }

    if (new Date() > user.mobileOTPExpires) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }

    if (user.mobileOTP !== otp) {
      return res.status(400).json({ error: 'Invalid verification OTP code.' });
    }

    user.phone = user.tempMobile;
    user.tempMobile = '';
    user.mobileOTP = '';
    user.mobileOTPExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Mobile number updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        dob: user.dob,
        gender: user.gender,
        avatar: user.avatar
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// --- SECURE FORGOT PASSWORD OTP FLOW ---

export const forgotPasswordRequest = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email address is required.' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No user account found with this email address.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.forgotOTP = otp;
    user.forgotOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.forgotOTPAttempts = 0;
    await user.save();

    EmailService.sendForgotPasswordOTP(email, otp);

    res.json({ success: true, message: 'Password reset OTP code sent to your email.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const forgotPasswordVerify = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP code are required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (!user.forgotOTP || !user.forgotOTPExpires) {
      return res.status(400).json({ error: 'No password reset request is active.' });
    }

    if (user.forgotOTPAttempts >= 5) {
      user.forgotOTP = '';
      user.forgotOTPExpires = null;
      await user.save();
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    if (new Date() > user.forgotOTPExpires) {
      return res.status(400).json({ error: 'OTP code has expired. Please request a new code.' });
    }

    if (user.forgotOTP !== otp) {
      user.forgotOTPAttempts += 1;
      await user.save();
      const remaining = 5 - user.forgotOTPAttempts;
      return res.status(400).json({ error: `Invalid OTP code. Remaining attempts: ${remaining}.` });
    }

    res.json({ success: true, message: 'OTP verified successfully. You may now reset your password.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const forgotPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ error: 'Email, OTP code, and new password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (!user.forgotOTP || user.forgotOTP !== otp || !user.forgotOTPExpires || new Date() > user.forgotOTPExpires || user.forgotOTPAttempts >= 5) {
      return res.status(400).json({ error: 'Invalid or expired session. Please start over.' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.forgotOTP = '';
    user.forgotOTPExpires = null;
    user.forgotOTPAttempts = 0;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully. You can now login.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
