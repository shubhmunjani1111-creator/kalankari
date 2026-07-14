import { Request, Response } from 'express';
import EmailLog from '../models/EmailLog';
import { EmailService } from '../services/emailService';

/**
 * Get all email logs (Admin only)
 */
export const getEmailLogs = async (req: Request, res: Response) => {
  try {
    const logs = await EmailLog.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Trigger manual retry for a failed email log (Admin only)
 */
export const retryEmail = async (req: Request, res: Response) => {
  try {
    const success = await EmailService.retryLoggedEmail(req.params.id);
    if (success) {
      res.json({ message: 'Retry process triggered successfully in background.' });
    } else {
      res.status(500).json({ error: 'Failed to trigger retry process.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/* ------------------- TEST SUITE ENDPOINTS ------------------- */

export const testWelcomeEmail = async (req: Request, res: Response) => {
  try {
    const mockUser = {
      name: req.body.name || 'Aditi Sharma',
      email: req.body.email || 'customer@example.com'
    };
    EmailService.sendWelcomeEmail(mockUser);
    res.json({ success: true, message: `Welcome email triggered for ${mockUser.email}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const testPasswordResetEmail = async (req: Request, res: Response) => {
  try {
    const mockUser = {
      name: req.body.name || 'Aditi Sharma',
      email: req.body.email || 'customer@example.com'
    };
    const mockResetUrl = 'https://kalankari.in/reset-password?token=mock_secure_token_123456';
    EmailService.sendPasswordResetEmail(mockUser, mockResetUrl);
    res.json({ success: true, message: `Password reset email triggered for ${mockUser.email}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Generates a mock order payload matching Kalankari DB schemas
const getMockOrder = (recipientEmail: string) => {
  return {
    _id: 'ord_mock897291a29f8c028e',
    id: 'ord_mock897291a29f8c028e',
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    payable: 1999,
    tax: 214.18,
    loyaltyPointsUsed: 50,
    loyaltyPointsEarned: 200,
    createdAt: new Date(),
    shippingAddress: {
      name: 'Aditi Sharma',
      email: recipientEmail || 'customer@example.com',
      phone: '+91 98765 43210',
      addressLine: 'Flat 402, Royal Residency, Ring Road',
      city: 'Surat',
      state: 'Gujarat',
      pin: '395007'
    },
    items: [
      {
        product: 'prod_6543210fecb27a19',
        name: 'Green Strip Premium Kurti',
        size: 'L',
        color: 'Green Floral',
        qty: 1,
        price: 1999,
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=300'
      }
    ]
  };
};

export const testAdminOrderEmail = async (req: Request, res: Response) => {
  try {
    const order = getMockOrder(req.body.email);
    EmailService.sendAdminOrderNotification(order);
    res.json({ success: true, message: 'New order admin notification triggered.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const testCustomerOrderEmail = async (req: Request, res: Response) => {
  try {
    const order = getMockOrder(req.body.email);
    EmailService.sendCustomerOrderConfirmation(order);
    res.json({ success: true, message: `Customer order confirmation triggered for ${order.shippingAddress.email}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const testOrderShippedEmail = async (req: Request, res: Response) => {
  try {
    const order = {
      ...getMockOrder(req.body.email),
      status: 'Shipped',
      courierName: req.body.courierName || 'Delhivery Express',
      trackingNumber: req.body.trackingNumber || 'AWB9876543210'
    };
    EmailService.sendOrderStatusEmail(order);
    res.json({ success: true, message: `Order shipped email triggered for ${order.shippingAddress.email}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const testOrderDeliveredEmail = async (req: Request, res: Response) => {
  try {
    const order = {
      ...getMockOrder(req.body.email),
      status: 'Delivered'
    };
    EmailService.sendOrderStatusEmail(order);
    res.json({ success: true, message: `Order delivered email triggered for ${order.shippingAddress.email}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


