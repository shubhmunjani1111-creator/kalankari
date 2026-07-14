import { Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import { EmailService } from '../services/emailService';

// Initialize Razorpay SDK using environment variables
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    console.warn("WARNING: Razorpay Key ID or Key Secret is missing in environment variables.");
  }

  return new Razorpay({
    key_id: key_id || 'rzp_test_mock_id',
    key_secret: key_secret || 'rzp_test_mock_secret'
  });
};

// DRY helper to process a completed order payment
export const processSuccessfulPayment = async (orderId: string, razorpayOrderId: string, razorpayPaymentId: string) => {
  const order = await Order.findById(orderId);
  if (!order) {
    console.error(`[PAYMENT LOG] Order not found for ID: ${orderId}`);
    return null;
  }

  // Prevent double-processing
  if (order.paymentStatus === 'Completed') {
    console.log(`[PAYMENT LOG] Order ${orderId} already marked as completed. Skipping inventory/loyalty sync.`);
    return order;
  }

  console.log(`[PAYMENT LOG] Settiing order ${orderId} as paid. Settle: ${razorpayPaymentId}`);

  order.paymentStatus = 'Completed';
  order.razorpayOrderId = razorpayOrderId;
  order.razorpayPaymentId = razorpayPaymentId;

  // 1. Deduct Inventory
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      product.stockCount = Math.max(0, product.stockCount - item.quantity);
      if (product.stockCount <= 0) {
        product.availability = 'Out of Stock';
      }
      await product.save();
      console.log(`[PAYMENT LOG] Deducted stock for product ${item.product}: -${item.quantity} Qty. New stock: ${product.stockCount}`);
    }
  }

  order.pointsEarned = 0;

  // 3. Update timeline tracking
  const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const stepIdx = order.timeline.findIndex(s => s.label === 'Ordered');
  if (stepIdx > -1) {
    order.timeline[stepIdx].desc = 'Order details accepted and payment verified successfully';
    order.timeline[stepIdx].date = dateStr;
  }

  await order.save();

  // Send admin order alert and customer order confirmation emails in background
  EmailService.sendAdminOrderNotification(order);
  EmailService.sendCustomerOrderConfirmation(order);

  return order;
};

// Create a new Razorpay order
export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    const razorpay = getRazorpayInstance();

    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency,
      receipt
    };

    const response = await razorpay.orders.create(options);
    
    console.log(`[PAYMENT LOG] Created Razorpay order ${response.id} for amount ${amount} ${currency}`);

    res.json({
      id: response.id,
      currency: response.currency,
      amount: response.amount,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_id'
    });
  } catch (err: any) {
    console.error(`[PAYMENT LOG] Create Razorpay order failed:`, err);
    res.status(500).json({ error: err.message });
  }
};

// Verify payment signature
export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mock_secret';

    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.warn(`[PAYMENT LOG] Signature verification failed for order ${order_id}`);
      return res.status(400).json({ error: 'Signature verification failed' });
    }

    // Process order updates (inventory, points, status)
    const order = await processSuccessfulPayment(order_id, razorpay_order_id, razorpay_payment_id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ status: 'Payment verified', order });
  } catch (err: any) {
    console.error(`[PAYMENT LOG] Verify payment failed:`, err);
    res.status(500).json({ error: err.message });
  }
};

// Webhook handling endpoint
export const razorpayWebhook = async (req: any, res: Response) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_2026';
    const receivedSignature = req.headers['x-razorpay-signature'] as string;
    
    if (!receivedSignature) {
      return res.status(400).json({ error: 'Missing Razorpay signature header.' });
    }

    // Verify webhook payload using the raw buffer (req.rawBody)
    const rawBodyBuffer = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(rawBodyBuffer);
    const digest = shasum.digest('hex');

    if (digest !== receivedSignature) {
      console.warn(`[PAYMENT LOG] Webhook signature verification failed.`);
      return res.status(403).json({ error: 'Invalid webhook signature.' });
    }

    // Process event: order.paid or payment.captured
    const event = req.body.event;
    console.log(`[PAYMENT LOG] Webhook signature verified. Event received: ${event}`);

    if (event === 'order.paid' || event === 'payment.captured') {
      const paymentEntity = req.body.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      // Find matching order in DB by Razorpay order ID
      const order = await Order.findOne({ razorpayOrderId });
      if (order) {
        await processSuccessfulPayment(order._id.toString(), razorpayOrderId, razorpayPaymentId);
        console.log(`[PAYMENT LOG] Webhook resolved order ${order._id} successfully.`);
      } else {
        console.warn(`[PAYMENT LOG] Webhook received for untracked Razorpay Order ID: ${razorpayOrderId}`);
      }
    }

    res.status(200).json({ status: 'Webhook processed' });
  } catch (err: any) {
    console.error(`[PAYMENT LOG] Webhook processing failed:`, err);
    res.status(500).json({ error: err.message });
  }
};
