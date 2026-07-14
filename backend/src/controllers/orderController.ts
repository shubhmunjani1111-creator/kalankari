import { Response } from 'express';
import Order from '../models/Order';
import User from '../models/User';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import { EmailService } from '../services/emailService';

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { items, subtotal, discount, pointsRedeemed, tax, shipping, payable, paymentMethod, shippingAddress } = req.body;

    // Validate stock availability
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.name} not found.` });
      }
      if (product.stockCount < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for product ${product.name}. Available: ${product.stockCount}` });
      }
    }

    const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    const timeline = [
      { label: 'Ordered', date: dateStr, desc: 'Order details accepted, awaiting shipping', active: true },
      { label: 'Packed & Dispatched', date: '', desc: 'Order packed and sent through Delhivery Courier service', active: false },
      { label: 'Out for Delivery', date: '', desc: 'Awaiting pickup from local hub dispatcher', active: false },
      { label: 'Delivered', date: '', desc: 'Awaiting final confirmation from courier agent', active: false }
    ];

    const userId = req.user ? req.user.id : null;

    const order = new Order({
      user: userId,
      items,
      subtotal,
      discount,
      pointsRedeemed: pointsRedeemed || 0,
      tax,
      shipping,
      payable,
      timeline,
      paymentMethod,
      shippingAddress,
      paymentStatus: 'Pending'
    });

    await order.save();

    // Trigger emails & stock decrease for Cash on Delivery orders immediately
    if (paymentMethod === 'cod') {
      for (const item of items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stockCount = Math.max(0, product.stockCount - item.quantity);
          if (product.stockCount <= 0) {
            product.availability = 'Out of Stock';
          }
          await product.save();
          console.log(`[ORDER LOG] Deducted stock for COD product ${item.product}: -${item.quantity} Qty. New stock: ${product.stockCount}`);
        }
      }

      EmailService.sendAdminOrderNotification(order);
      EmailService.sendCustomerOrderConfirmation(order);
    }

    // Update email in user profile if it differs or is missing
    if (userId && shippingAddress.email) {
      await User.findByIdAndUpdate(userId, { email: shippingAddress.email });
    }

    res.status(201).json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Allow lookup if they are admin, or if the order matches the user ID,
    // or if guest lookup matches the shippingAddress details
    const isOwner = req.user && order.user && order.user.toString() === req.user.id;
    const isAdmin = req.user && req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      // Query parameters lookup fallback (validation checks)
      const { mobile } = req.query;
      if (!mobile || order.shippingAddress!.phone !== mobile) {
        return res.status(403).json({ error: 'Access denied: Invalid Order ID or Mobile Number.' });
      }
    }

    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, courierName, trackingNumber } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const oldStatus = order.status;
    order.status = status;

    if (courierName) order.courierName = courierName;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    // For COD orders, if status is updated to Delivered, mark paymentStatus as Completed
    if (order.paymentMethod === 'cod' && status === 'Delivered') {
      order.paymentStatus = 'Completed';
    }

    // Update tracking timeline step
    const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const stepIdx = order.timeline.findIndex(s => s.label === status);
    if (stepIdx > -1) {
      order.timeline[stepIdx].active = true;
      order.timeline[stepIdx].date = dateStr;
    } else {
      // Append custom timeline events (e.g. Return Requested)
      order.timeline.push({
        label: status,
        date: dateStr,
        desc: `Status updated to ${status}`,
        active: true
      });
    }

    await order.save();

    // Trigger order status email (Shipped / Delivered) asynchronously in background
    EmailService.sendOrderStatusEmail(order);

    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const requestReturn = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { reason, description, photos } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.user && order.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    order.status = 'Return Requested';
    order.returnDetails = {
      reason,
      description,
      photos: photos || [],
      status: 'Requested',
      requestDate: new Date()
    };

    order.timeline.push({
      label: 'Return Requested',
      date: new Date().toLocaleDateString('en-IN'),
      desc: `Return requested. Reason: ${reason}`,
      active: true
    });

    await order.save();
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllOrdersAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Generates printable HTML Tax Invoice
export const generateGSTInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Validate ownership
    const isOwner = req.user && order.user && order.user.toString() === req.user.id;
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      const { mobile } = req.query;
      if (!mobile || order.shippingAddress!.phone !== mobile) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://kalankari.com';

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - Kalankari</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; line-height: 1.5; }
          .invoice-box { max-width: 800px; margin: auto; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.05); padding: 30px; border-radius: 8px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #8B2635; padding-bottom: 20px; margin-bottom: 20px; }
          .company-details { text-align: right; font-size: 12px; }
          .title { font-size: 24px; font-weight: bold; color: #8B2635; margin: 0; }
          .meta-info { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13px; }
          .billing-shipping { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 13px; }
          .billing-shipping h4 { margin: 0 0 8px 0; color: #8B2635; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
          .item-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
          .item-table th { background: #8B2635; color: #fff; padding: 10px; text-align: left; }
          .item-table td { padding: 10px; border-bottom: 1px solid #eee; }
          .summary-table { margin-left: auto; width: 300px; border-collapse: collapse; font-size: 13px; }
          .summary-table td { padding: 8px 10px; border-bottom: 1px solid #eee; }
          .summary-table .total { font-weight: bold; font-size: 15px; color: #8B2635; border-bottom: 2px solid #8B2635; }
          .footer-note { text-align: center; margin-top: 50px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          @media print {
            body { padding: 0; }
            .invoice-box { border: none; box-shadow: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div style="display: flex; align-items: center; gap: 15px;">
              <img src="${FRONTEND_URL}/logo.jpg" alt="Kalankari Logo" style="height: 50px; width: auto; object-fit: contain;" />
              <div>
                <p class="title" style="margin-left: 10px;">INVOICE</p>
              </div>
            </div>
            <div class="company-details">
              <strong>Kalankari</strong><br>
              Kedar Business Center, Dabholi Road,<br>
              Katargam, Surat - 395004<br>
              Gujarat, India | support@kalankari.com
            </div>
          </div>

          <div class="meta-info">
            <div>
              <strong>Invoice No:</strong> KLN-${order._id.toString().substring(18).toUpperCase()}<br>
              <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN')}<br>
              <strong>Payment Mode:</strong> ${order.paymentMethod.toUpperCase()}
            </div>
            <div style="text-align: right;">
              <strong>Order ID:</strong> #${order._id}<br>
              <strong>Status:</strong> ${order.paymentStatus}<br>
              <strong>Txn Ref:</strong> ${order.razorpayPaymentId || 'N/A'}
            </div>
          </div>

          <div class="billing-shipping">
            <div>
              <h4>Billed To</h4>
              <strong>${order.shippingAddress!.name}</strong><br>
              Phone: ${order.shippingAddress!.phone}<br>
              Email: ${order.shippingAddress!.email}
            </div>
            <div>
              <h4>Shipped To</h4>
              ${order.shippingAddress!.street}<br>
              ${order.shippingAddress!.city}, ${order.shippingAddress!.state} - ${order.shippingAddress!.pin}<br>
              India
            </div>
          </div>

          <table class="item-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Size</th>
                <th style="text-align: center;">Price</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((item: any) => `
                <tr>
                  <td>${item.name}</td>
                  <td style="text-align: center;">${item.selectedSize}</td>
                  <td style="text-align: center;">₹${item.price}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">₹${item.price * item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <table class="summary-table">
            <tr>
              <td>Subtotal</td>
              <td style="text-align: right;">₹${order.subtotal}</td>
            </tr>
            ${order.discount > 0 ? `
            <tr>
              <td>Discount</td>
              <td style="text-align: right; color: green;">-₹${order.discount}</td>
            </tr>` : ''}
            <tr>
              <td>Shipping Fee</td>
              <td style="text-align: right;">${order.shipping === 0 ? 'FREE' : '₹' + order.shipping}</td>
            </tr>
            <tr class="total">
              <td>Total Payable</td>
              <td style="text-align: right;">₹${order.payable}</td>
            </tr>
          </table>

          <div class="footer-note">
            This is a computer-generated Invoice and requires no physical signature.<br>
            Thank you for shopping at Kalankari. Celebrating premium Indian artistry.
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(invoiceHtml);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Generates a new Razorpay order ID for an existing unpaid/failed order
export const retryOrderPayment = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Validate ownership
    if (order.user && order.user.toString() !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.paymentStatus === 'Completed') {
      return res.status(400).json({ error: 'This order has already been paid.' });
    }

    const Razorpay = require('razorpay');
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    const razorpay = new Razorpay({
      key_id: key_id || 'rzp_test_mock_id',
      key_secret: key_secret || 'rzp_test_mock_secret'
    });

    const options = {
      amount: Math.round(order.payable * 100), // paise
      currency: 'INR',
      receipt: `receipt_retry_${order._id}`
    };

    const response = await razorpay.orders.create(options);

    // Save the new razorpay order ID on the order in MongoDB
    order.razorpayOrderId = response.id;
    await order.save();

    res.json({
      id: response.id,
      currency: response.currency,
      amount: response.amount
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Returns statistics for the admin dashboard summary
export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find();
    const productsCount = await Product.countDocuments();
    const customersCount = await User.countDocuments({ role: 'customer' });

    let totalSales = 0;
    const salesByDate: { [key: string]: number } = {};

    // Seed the last 7 days with zero sales
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      salesByDate[dateKey] = 0;
    }

    orders.forEach((order) => {
      if (order.paymentStatus === 'Completed' || order.status === 'Delivered') {
        totalSales += order.payable;
      }
      
      const dateKey = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      if (salesByDate[dateKey] !== undefined) {
        if (order.paymentStatus === 'Completed' || order.status === 'Delivered') {
          salesByDate[dateKey] += order.payable;
        }
      }
    });

    const salesGraphData = Object.keys(salesByDate).map((date) => ({
      date,
      sales: salesByDate[date]
    }));

    res.json({
      totalSales,
      ordersCount: orders.length,
      productsCount,
      customersCount,
      salesGraphData
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// V2.2: Delete order (Admin only)
export const deleteOrderAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
