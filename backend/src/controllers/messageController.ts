import { Request, Response } from 'express';
import Message from '../models/Message';
import { EmailService } from '../services/emailService';
import nodemailer from 'nodemailer';

/**
 * Submit Contact Inquiry Form
 * Validates inputs, saves to MongoDB and dispatches notifications
 */
export const submitContactMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    // Email regex check
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(String(email).toLowerCase())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Phone regex check
    if (phone) {
      const phoneRe = /^[6-9]\d{9}$/;
      if (!phoneRe.test(String(phone))) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
      }
    }

    const newMessage = new Message({
      name,
      email,
      phone: phone || '',
      subject: subject || 'General Inquiry',
      message
    });

    await newMessage.save();

    // Dispatch actual HTTP emails asynchronously in background
    EmailService.sendAdminContactInquiry(newMessage);
    EmailService.sendCustomerContactAcknowledgement(newMessage);

    res.status(201).json({
      message: 'Thank you for contacting Kalankari. Our team will get back to you shortly.',
      inquiry: newMessage
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get support inquiries (Admin only)
 * Filters by status and supports search queries
 */
export const getMessagesAdmin = async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    let query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { message: searchRegex },
        { subject: searchRegex }
      ];
    }

    const messages = await Message.find(query).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Submit support reply message (Admin only)
 * Saves reply and updates status to completed
 */
export const replyToMessageAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { replyText } = req.body;

    if (!replyText) {
      return res.status(400).json({ error: 'Reply text cannot be empty.' });
    }

    const msg = await Message.findById(id);
    if (!msg) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }

    msg.replies.push(replyText);
    msg.status = 'completed';
    msg.replyDate = new Date();
    await msg.save();

    // Dispatch the email response to customer
    EmailService.sendSupportReply(msg, replyText);

    console.log(`[MAIL] Support reply sent to customer ${msg.email} for inquiry #${msg._id}`);

    res.json({ message: 'Reply submitted successfully.', inquiry: msg });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete support message (Admin only)
 */
export const deleteMessageAdmin = async (req: Request, res: Response) => {
  try {
    const msg = await Message.findByIdAndDelete(req.params.id);
    if (!msg) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }
    res.json({ message: 'Support ticket deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Mark support message as read (Admin only)
 */
export const markMessageReadAdmin = async (req: Request, res: Response) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }
    msg.status = 'completed';
    await msg.save();
    res.json({ message: 'Support message marked as read successfully.', inquiry: msg });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
