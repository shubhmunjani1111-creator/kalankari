import EmailLog from '../models/EmailLog';
import dotenv from 'dotenv';

dotenv.config();

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'mock'; // resend, brevo, mock
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@kalankari.in';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://kalankari.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

// Helper to wrap body content in the base HTML email template (brand aligned)
const getBaseTemplate = (title: string, bodyContent: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            background-color: #FFF8F2;
            color: #2D2D2D;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border: 1px solid #C49A6C;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(139, 69, 19, 0.05);
          }
          .header {
            background-color: #8B4513;
            color: #ffffff;
            padding: 30px;
            text-align: center;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 3px;
            margin: 0 0 5px 0;
          }
          .header-subtitle {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            opacity: 0.8;
          }
          .content {
            padding: 40px 30px;
            line-height: 1.6;
            font-size: 13px;
          }
          .title {
            font-size: 20px;
            font-weight: bold;
            color: #8B4513;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            background-color: #8B4513;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 30px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-radius: 6px;
            margin: 25px 0;
            text-align: center;
          }
          .item-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .item-table th {
            border-bottom: 2px solid #C49A6C;
            padding: 8px;
            text-align: left;
            color: #8B4513;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
          }
          .item-table td {
            border-bottom: 1px solid #FFF8F2;
            padding: 10px 8px;
            font-size: 12px;
          }
          .summary-card {
            background-color: #FFF8F2;
            border: 1px solid #C49A6C;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12px;
          }
          .summary-row.total {
            font-weight: bold;
            border-top: 1px solid #C49A6C;
            padding-top: 8px;
            margin-top: 8px;
            color: #8B4513;
            font-size: 14px;
          }
          .footer {
            background-color: #FFF8F2;
            border-top: 1px solid #C49A6C;
            padding: 30px 20px;
            text-align: center;
            font-size: 11px;
            color: #777777;
          }
          .social-links {
            margin-bottom: 15px;
          }
          .social-link {
            margin: 0 10px;
            color: #8B4513;
            text-decoration: none;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">KALANKARI</div>
            <div class="header-subtitle">Wear Art. Wear Heritage.</div>
          </div>
          <div class="content">
            ${bodyContent}
          </div>
          <div class="footer">
            <div class="social-links">
              <a href="https://instagram.com/kalankari" class="social-link">Instagram</a> | 
              <a href="${FRONTEND_URL}" class="social-link">Official Shop</a>
            </div>
            <p>You received this email because you registered or ordered from our online boutique.<br>
            © ${new Date().getFullYear()} Kalankari. Surat, Gujarat, India.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

export class EmailService {
  /**
   * Core HTTP REST Dispatcher supporting Resend and Brevo APIs
   */
  private static async dispatchEmailHttp(recipient: string, subject: string, html: string): Promise<{ success: boolean; responseText: string }> {
    if (EMAIL_PROVIDER === 'mock' || !EMAIL_API_KEY) {
      console.log(`[EMAIL SERVICE] [MOCK SEND] To: ${recipient} | Subject: ${subject}`);
      return { success: true, responseText: 'Mock email sent successfully (no API key configured).' };
    }

    try {
      if (EMAIL_PROVIDER === 'resend') {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${EMAIL_API_KEY}`
          },
          body: JSON.stringify({
            from: `Kalankari <${FROM_EMAIL}>`, // Default sender for test keys, configure custom domains in production
            to: [recipient],
            subject: subject,
            html: html
          })
        });
        
        const data = await response.text();
        return {
          success: response.ok,
          responseText: data
        };
      } 
      
      if (EMAIL_PROVIDER === 'brevo') {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': EMAIL_API_KEY
          },
          body: JSON.stringify({
            sender: { name: 'Kalankari', email: FROM_EMAIL === 'onboarding@resend.dev' ? 'orders@kalankari.in' : FROM_EMAIL },
            to: [{ email: recipient }],
            subject: subject,
            htmlContent: html
          })
        });
        
        const data = await response.text();
        return {
          success: response.ok,
          responseText: data
        };
      }

      throw new Error(`Unsupported email provider configured: ${EMAIL_PROVIDER}`);
    } catch (err: any) {
      return {
        success: false,
        responseText: err.message || 'HTTP dispatch failed'
      };
    }
  }

  /**
   * Logs email to database and schedules sending asynchronously so checkout is not blocked.
   */
  public static logAndSendEmail(recipient: string, subject: string, type: string, html: string, metadata?: any) {
    // Run asynchronous task in background (never block current execution flow)
    (async () => {
      let emailLog = new EmailLog({
        recipient,
        subject,
        type,
        status: 'pending',
        provider: EMAIL_PROVIDER,
        attempts: 0,
        metadata
      });

      await emailLog.save();
      await this.dispatchWithRetry(emailLog._id.toString(), recipient, subject, type, html);
    })().catch(err => {
      console.error('[EMAIL SERVICE] Fatal background logging error:', err);
    });
  }

  /**
   * Internal dispatcher wrapper carrying out automatic retries (up to 3 times)
   */
  private static async dispatchWithRetry(logId: string, recipient: string, subject: string, type: string, html: string) {
    const maxRetries = 3;
    let attempt = 0;
    let success = false;
    let responseText = '';

    while (attempt < maxRetries && !success) {
      attempt++;
      console.log(`[EMAIL SERVICE] Sending email to ${recipient} (Attempt ${attempt}/${maxRetries})...`);
      
      const dispatchResult = await this.dispatchEmailHttp(recipient, subject, html);
      success = dispatchResult.success;
      responseText = dispatchResult.responseText;

      if (!success && attempt < maxRetries) {
        // Wait 5 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    try {
      await EmailLog.findByIdAndUpdate(logId, {
        status: success ? 'sent' : 'failed',
        attempts: attempt,
        providerResponse: responseText,
        errorMsg: success ? undefined : `Failed after ${attempt} attempts. Response: ${responseText}`
      });
      console.log(`[EMAIL SERVICE] Log ${logId} marked as ${success ? 'SENT' : 'FAILED'}`);
    } catch (err) {
      console.error(`[EMAIL SERVICE] Failed to update EmailLog ${logId}:`, err);
    }
  }

  /**
   * Re-triggers a failed/pending email log from the admin panel list
   */
  public static async retryLoggedEmail(logId: string): Promise<boolean> {
    try {
      const log = await EmailLog.findById(logId);
      if (!log) throw new Error('Email log not found');
      
      // Regenerate template context if needed, but since we already store the full subject, 
      // recipient, and metadata, we can fetch the HTML templates dynamically.
      // For simplicity, we can reconstruct the HTML content based on the type and log's metadata
      const html = await this.rebuildHtmlForLog(log);
      
      // Trigger sending in background
      this.dispatchWithRetry(logId, log.recipient, log.subject, log.type, html).catch(err => {
        console.error(`[EMAIL SERVICE] Retry process exception:`, err);
      });
      
      return true;
    } catch (err) {
      console.error('[EMAIL SERVICE] Admin retry trigger failed:', err);
      return false;
    }
  }

  /**
   * Helper to rebuild the templates for logs retries
   */
  private static async rebuildHtmlForLog(log: any): Promise<string> {
    // Basic dynamic reconstruction
    if (log.type === 'welcome') {
      return this.buildWelcomeTemplate(log.metadata?.userName || 'Customer');
    }
    if (log.type === 'password_reset') {
      return this.buildPasswordResetTemplate(log.metadata?.userName || 'Customer', log.metadata?.resetUrl || '#');
    }
    if (log.type === 'admin_order') {
      return this.buildAdminOrderTemplate(log.metadata?.order);
    }
    if (log.type === 'customer_order') {
      return this.buildCustomerOrderTemplate(log.metadata?.order);
    }
    if (log.type === 'status_shipped') {
      return this.buildShippedTemplate(log.metadata?.order);
    }
    if (log.type === 'status_delivered') {
      return this.buildDeliveredTemplate(log.metadata?.order);
    }
    if (log.type === 'contact_admin') {
      return this.buildContactAdminTemplate(log.metadata?.inquiry);
    }
    if (log.type === 'contact_customer') {
      return this.buildContactCustomerTemplate(log.metadata?.inquiry);
    }
    return getBaseTemplate(log.subject, `<p>Notification content for ${log.subject} (Retried)</p>`);
  }

  /* ------------------- TEMPLATE BUILDERS ------------------- */

  private static buildWelcomeTemplate(name: string): string {
    const html = `
      <div class="title">Welcome to Kalankari, ${name}! ✨</div>
      <p>We are absolutely thrilled to welcome you to our family. At Kalankari, we are on a mission to bring India's rich mythological motifs, royal digital art, and classical design heritage directly into your wardrobe.</p>
      <p>Every single kurti in our collections is designed using premium silks, linens, and breathable cotton blends, tailored carefully for the modern woman who values style and elegance.</p>
      <div style="text-align: center;">
        <a href="${FRONTEND_URL}/shop" class="button">Explore Our Catalog</a>
      </div>
      <p>If you ever have any questions about fabric care, sizing options, or shipping estimates, reply directly to this email or visit our Help Desk.</p>
    `;
    return getBaseTemplate('Welcome to Kalankari', html);
  }

  private static buildPasswordResetTemplate(name: string, resetUrl: string): string {
    const html = `
      <div class="title">Reset Your Password 🔐</div>
      <p>Hi ${name},</p>
      <p>We received a request to reset the password for your Kalankari account. Click the button below to secure your account and establish a new credential:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      <p style="color: #999999; font-size: 11px;">⚠️ Important Security Notice: This password reset link is highly secure and will expire in exactly 15 minutes. If you did not make this request, please ignore this email.</p>
    `;
    return getBaseTemplate('Password Reset Request', html);
  }

  private static buildAdminOrderTemplate(order: any): string {
    const itemsHtml = order.items.map((item: any) => `
      <tr>
        <td><strong>${item.name}</strong><br>Size: ${item.selectedSize || 'M'}</td>
        <td style="text-align: center;">${item.quantity || 1}</td>
        <td style="text-align: right;">₹${item.price.toLocaleString()}</td>
      </tr>
    `).join('');

    const html = `
      <div class="title" style="color: #c49a6c;">🛍 New Order Received!</div>
      <p>A new order has been securely registered in MongoDB. Here are the customer and transaction details:</p>
      
      <table class="item-table">
        <thead>
          <tr>
            <th>Product details</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="summary-card">
        <h4 style="margin-top: 0; color: #8B4513; border-bottom: 1px solid #C49A6C; padding-bottom: 5px;">Order Details</h4>
        <div class="summary-row"><span>Order Reference</span> <strong>#${order._id || order.id}</strong></div>
        <div class="summary-row"><span>Customer Name</span> <span>${order.shippingAddress?.name || 'Customer'}</span></div>
        <div class="summary-row"><span>Email</span> <span>${order.shippingAddress?.email || 'N/A'}</span></div>
        <div class="summary-row"><span>Mobile</span> <span>${order.shippingAddress?.phone || 'N/A'}</span></div>
        <div class="summary-row"><span>Payment Method</span> <span style="text-transform: uppercase;">${order.paymentMethod}</span></div>
        <div class="summary-row"><span>Payment Status</span> <strong>${order.paymentStatus}</strong></div>
        <div class="summary-row"><span>Points Used</span> <span>${order.loyaltyPointsUsed || 0}</span></div>
        <div class="summary-row"><span>Points Earned</span> <span>${order.loyaltyPointsEarned || 0}</span></div>
        <div class="summary-row"><span>Shipping Address</span> <span>${order.shippingAddress?.street}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.pin || order.shippingAddress?.pincode}</span></div>
      </div>

      <div class="summary-card">
        <h4 style="margin-top: 0; color: #8B4513; border-bottom: 1px solid #C49A6C; padding-bottom: 5px;">Financials Summary</h4>
        <div class="summary-row"><span>Gross Total</span> <span>₹${(order.payable - order.tax).toLocaleString()}</span></div>
        <div class="summary-row"><span>GST Tax (12%)</span> <span>₹${order.tax.toLocaleString()}</span></div>
        <div class="summary-row"><span>Shipping Charge</span> <span>₹0</span></div>
        <div class="summary-row total"><span>Grand Total Billed</span> <span>₹${order.payable.toLocaleString()}</span></div>
      </div>

      <div style="text-align: center;">
        <a href="${FRONTEND_URL}/dashboard" class="button">Open Admin Dashboard</a>
      </div>
    `;
    return getBaseTemplate('New Order Registered - Kalankari', html);
  }

  private static buildCustomerOrderTemplate(order: any): string {
    const itemsHtml = order.items.map((item: any) => `
      <tr>
        <td style="display: flex; align-items: center; gap: 10px;">
          <img src="${item.image || `${FRONTEND_URL}/logo.jpg`}" width="40" height="50" style="object-cover; border-radius: 4px;" />
          <div><strong>${item.name}</strong><br>Size: ${item.selectedSize || 'M'}</div>
        </td>
        <td style="text-align: center;">${item.quantity || 1}</td>
        <td style="text-align: right;">₹${item.price.toLocaleString()}</td>
      </tr>
    `).join('');

    const estDelivery = new Date(new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' });

    const html = `
      <div class="title">Your Kalankari Order is Confirmed 🎉</div>
      <p>Hi ${order.shippingAddress?.name || 'Valued Customer'},</p>
      <p>Thank you for choosing Kalankari! We are preparing your order. Our team in Surat is packing your premium digital print fabrics with love.</p>
      
      <table class="item-table">
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="summary-card">
        <div class="summary-row"><span>Order ID</span> <strong>#${order._id || order.id}</strong></div>
        <div class="summary-row"><span>Estimated Delivery</span> <span>${estDelivery}</span></div>
        <div class="summary-row"><span>Delivery Address</span> <span>${order.shippingAddress?.street}, ${order.shippingAddress?.city} - ${order.shippingAddress?.pin || order.shippingAddress?.pincode}</span></div>
        <div class="summary-row total"><span>Total Amount Paid</span> <span>₹${order.payable.toLocaleString()}</span></div>
      </div>

      <div style="text-align: center; gap: 10px; display: flex; justify-content: center; flex-wrap: wrap;">
        <a href="${FRONTEND_URL}/dashboard" class="button" style="margin: 10px;">Track Order Status</a>
        <a href="${FRONTEND_URL}/contact" class="button" style="margin: 10px; background-color: #C49A6C; border: 1px solid #C49A6C;">Customer Support</a>
      </div>
    `;
    return getBaseTemplate('Your Order is Confirmed', html);
  }

  private static buildShippedTemplate(order: any): string {
    const html = `
      <div class="title">Your Order is on the Way 🚚</div>
      <p>Hi ${order.shippingAddress?.name || 'Valued Customer'},</p>
      <p>Excited news! Your digital printed kurti design order <strong>#${order._id || order.id}</strong> has been successfully dispatched from our shipping hub in Surat.</p>
      
      <div class="summary-card">
        <div class="summary-row"><span>Courier Partner</span> <strong>${order.courierName || 'Delhivery Express'}</strong></div>
        <div class="summary-row"><span>Tracking AWB Number</span> <strong>${order.trackingNumber || 'AWB9876543210'}</strong></div>
      </div>

      <div style="text-align: center;">
        <a href="${FRONTEND_URL}/dashboard" class="button">Track Package Live</a>
      </div>
    `;
    return getBaseTemplate('Your Order has Shipped!', html);
  }

  private static buildDeliveredTemplate(order: any): string {
    const html = `
      <div class="title">Your Order has been Delivered ❤️</div>
      <p>Hi ${order.shippingAddress?.name || 'Valued Customer'},</p>
      <p>Your package carrying order <strong>#${order._id || order.id}</strong> has been successfully delivered to your shipping address!</p>
      <p>We hope you love your new premium digital printed kurtis. We would love to hear your feedback on the fabric feel, prints quality, and silhouette fitting:</p>
      
      <div style="text-align: center;">
        <a href="${FRONTEND_URL}/shop/${order.items[0]?.product || ''}" class="button">Write a Review</a>
      </div>
      
      <p>Tag us in your outfit styling on Instagram to get featured on our brand wall!</p>
      <div style="text-align: center;">
        <a href="https://instagram.com/kalankari" class="button" style="background-color: #C49A6C;">Follow Kalankari on Instagram</a>
      </div>
    `;
    return getBaseTemplate('Your Package is Delivered!', html);
  }

  /* ------------------- TRIGGER METHODS ------------------- */

  public static sendWelcomeEmail(user: any) {
    const html = this.buildWelcomeTemplate(user.name);
    this.logAndSendEmail(user.email, 'Welcome to Kalankari ✨', 'welcome', html, { userName: user.name });
  }

  public static sendPasswordResetEmail(user: any, resetUrl: string) {
    const html = this.buildPasswordResetTemplate(user.name, resetUrl);
    this.logAndSendEmail(user.email, 'Reset Password Request 🔐 - Kalankari', 'password_reset', html, { userName: user.name, resetUrl });
  }

  public static sendAdminOrderNotification(order: any) {
    const html = this.buildAdminOrderTemplate(order);
    this.logAndSendEmail(ADMIN_EMAIL, '🛍 New Order Received - Kalankari', 'admin_order', html, { order });
  }

  public static sendCustomerOrderConfirmation(order: any) {
    const html = this.buildCustomerOrderTemplate(order);
    this.logAndSendEmail(order.shippingAddress?.email, 'Your Kalankari Order is Confirmed 🎉', 'customer_order', html, { order });
  }

  public static sendOrderStatusEmail(order: any) {
    let subject = '';
    let type = '';
    let html = '';

    if (order.status === 'Shipped') {
      subject = 'Your Order is on the Way 🚚';
      type = 'status_shipped';
      html = this.buildShippedTemplate(order);
    } else if (order.status === 'Delivered') {
      subject = 'Your Order has been Delivered ❤️';
      type = 'status_delivered';
      html = this.buildDeliveredTemplate(order);
    } else {
      return; // Ignore other state updates
    }

    this.logAndSendEmail(order.shippingAddress?.email, subject, type, html, { order });
  }

  private static buildContactAdminTemplate(inquiry: any): string {
    const html = `
      <div class="title" style="color: #8B4513;">📩 New Support Message Received</div>
      <p>A customer has submitted a message via the online contact form. Details below:</p>
      <div class="summary-card">
        <div class="summary-row"><span>Customer Name</span> <strong>${inquiry.name}</strong></div>
        <div class="summary-row"><span>Email Address</span> <span>${inquiry.email}</span></div>
        <div class="summary-row"><span>Phone Number</span> <span>${inquiry.phone || 'Not Provided'}</span></div>
        <div class="summary-row"><span>Subject</span> <span>${inquiry.subject || 'General Inquiry'}</span></div>
        <div class="summary-row"><span>Timestamp</span> <span>${new Date(inquiry.createdAt || new Date()).toLocaleString('en-IN')}</span></div>
      </div>
      <div class="summary-card" style="background-color: #ffffff; border-color: #C49A6C;">
        <h4 style="margin: 0 0 10px 0; color: #8B4513;">Message Details:</h4>
        <p style="margin: 0; white-space: pre-wrap; font-style: italic; color: #2D2D2D;">${inquiry.message}</p>
      </div>
      <div style="text-align: center;">
        <a href="${FRONTEND_URL}/dashboard" class="button">Open Support Desk</a>
      </div>
    `;
    return getBaseTemplate('New Customer Inquiry - Support Desk', html);
  }

  private static buildContactCustomerTemplate(inquiry: any): string {
    const html = `
      <p>Hi ${inquiry.name},</p>
      <p>Thank you for reaching out to Kalankari. We have successfully registered your message regarding <strong>"${inquiry.subject || 'General Inquiry'}"</strong>.</p>
      <p>Our customer service team is currently reviewing your inquiry and will get back to you shortly (usually within 24 business hours).</p>
      <p>Thank you for your patience and for supporting Indian classical design heritage!</p>
      <div style="text-align: center;">
        <a href="${FRONTEND_URL}/shop" class="button">Browse Collections</a>
      </div>
    `;
    return getBaseTemplate("We've received your message | Kalankari", html);
  }

  private static buildSupportReplyTemplate(inquiry: any, replyText: string): string {
    const html = `
      <div class="title" style="color: #8B4513;">✉️ Reply to Your Inquiry</div>
      <p>Hi ${inquiry.name},</p>
      <p>This is a reply to your support inquiry regarding <strong>"${inquiry.subject || 'General Inquiry'}"</strong>:</p>
      
      <div class="summary-box" style="background-color: #FDFBF7; border: 1px solid #E6DFD5; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 13px; line-height: 1.6; color: #2D2D2D; text-align: left;">
        <p style="margin: 0; white-space: pre-wrap; font-weight: 500;">${replyText}</p>
      </div>

      <p style="font-size: 11px; color: #8C8C8C; border-top: 1px solid #ECECEC; padding-top: 15px; margin-top: 25px; text-align: left;">
        <strong>Your original message:</strong><br/>
        <em>"${inquiry.message}"</em>
      </p>
    `;
    return getBaseTemplate(`Reply to Inquiry | Kalankari`, html);
  }

  public static sendAdminContactInquiry(inquiry: any) {
    const html = this.buildContactAdminTemplate(inquiry);
    this.logAndSendEmail(ADMIN_EMAIL, `📩 New Support Message Received | Kalankari`, 'contact_admin', html, { inquiry });
  }

  public static sendCustomerContactAcknowledgement(inquiry: any) {
    const html = this.buildContactCustomerTemplate(inquiry);
    this.logAndSendEmail(inquiry.email, "We've received your message | Kalankari", 'contact_customer', html, { inquiry });
  }

  public static sendSupportReply(inquiry: any, replyText: string) {
    const html = this.buildSupportReplyTemplate(inquiry, replyText);
    this.logAndSendEmail(inquiry.email, `Reply: ${inquiry.subject || 'Support Ticket'} | Kalankari`, 'support_reply', html, { inquiry, replyText });
  }

  public static sendEmailVerificationOTP(email: string, otp: string) {
    const html = getBaseTemplate(
      'Verify Your Email Address',
      `
      <div class="title">Verify Your New Email Address ✉️</div>
      <p>We received a request to change the registered email address for your Kalankari account.</p>
      <p>Use the following 6-digit One-Time Password (OTP) to complete the verification:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #8B2635; border: 2px dashed #D4A373; padding: 10px 20px; border-radius: 8px; background-color: #FFFDF9;">${otp}</span>
      </div>
      <p>This verification code is valid for <strong>10 minutes</strong>. If you did not request this email, please ignore it or secure your account.</p>
      `
    );
    this.logAndSendEmail(email, 'Email Change Verification Code | Kalankari', 'email_otp', html, { otp });
  }

  public static sendMobileVerificationOTP(email: string, phone: string, otp: string) {
    const html = getBaseTemplate(
      'Verify Your Mobile Number',
      `
      <div class="title">Verify Your New Mobile Number 📱</div>
      <p>We received a request to change the registered mobile number for your Kalankari account to <strong>${phone}</strong>.</p>
      <p>Use the following 6-digit One-Time Password (OTP) to complete the verification:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #8B2635; border: 2px dashed #D4A373; padding: 10px 20px; border-radius: 8px; background-color: #FFFDF9;">${otp}</span>
      </div>
      <p>This verification code is valid for <strong>10 minutes</strong>.</p>
      `
    );
    this.logAndSendEmail(email, 'Mobile Change Verification Code | Kalankari', 'mobile_otp', html, { phone, otp });
  }

  public static sendForgotPasswordOTP(email: string, otp: string) {
    const html = getBaseTemplate(
      'Reset Your Password',
      `
      <div class="title">Reset Your Password 🔐</div>
      <p>We received a request to reset the password for your Kalankari account.</p>
      <p>Use the following 6-digit One-Time Password (OTP) to verify your request:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #8B2635; border: 2px dashed #D4A373; padding: 10px 20px; border-radius: 8px; background-color: #FFFDF9;">${otp}</span>
      </div>
      <p>This code is valid for <strong>10 minutes</strong> and will expire after 5 incorrect entry attempts.</p>
      <p>If you did not request a password reset, please secure your account immediately.</p>
      `
    );
    this.logAndSendEmail(email, 'Password Reset OTP Code | Kalankari', 'forgot_password_otp', html, { otp });
  }
}
