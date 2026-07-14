import SMSLog from '../models/SMSLog';
import dotenv from 'dotenv';

dotenv.config();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

export class SMSService {
  /**
   * Dispatches Twilio SMS via direct HTTP REST API calls
   */
  private static async dispatchSMSHttp(recipient: string, messageBody: string): Promise<{ success: boolean; responseText: string }> {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.log(`[SMS SERVICE] [MOCK SEND] To: ${recipient} | Body: ${messageBody}`);
      return { success: true, responseText: 'Mock SMS logged (no Twilio credentials configured).' };
    }

    try {
      const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', recipient);
      params.append('From', TWILIO_PHONE_NUMBER);
      params.append('Body', messageBody);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`
          },
          body: params.toString()
        }
      );

      const data = await response.text();
      return {
        success: response.ok,
        responseText: data
      };
    } catch (err: any) {
      return {
        success: false,
        responseText: err.message || 'Twilio REST dispatch failed'
      };
    }
  }

  /**
   * Logs and dispatches SMS in background
   */
  public static logAndSendSMS(recipient: string, body: string) {
    if (!recipient) return;
    
    // Clean and validate phone format: Twilio prefers + country code (e.g. +91)
    let formattedPhone = recipient.trim();
    if (!formattedPhone.startsWith('+')) {
      // Default to India country code if length is 10 digits
      if (formattedPhone.length === 10) {
        formattedPhone = `+91${formattedPhone}`;
      } else if (formattedPhone.startsWith('91') && formattedPhone.length === 12) {
        formattedPhone = `+${formattedPhone}`;
      }
    }

    (async () => {
      const smsLog = new SMSLog({
        recipient: formattedPhone,
        body,
        status: 'pending'
      });
      await smsLog.save();

      const result = await this.dispatchSMSHttp(formattedPhone, body);

      smsLog.status = result.success ? 'sent' : 'failed';
      smsLog.providerResponse = result.responseText;
      if (!result.success) {
        smsLog.errorMsg = result.responseText;
      }
      await smsLog.save();
      console.log(`[SMS SERVICE] Log ${smsLog._id} marked as ${smsLog.status}`);
    })().catch(err => {
      console.error('[SMS SERVICE] Background dispatch failed:', err);
    });
  }

  /**
   * Trigger order confirmation SMS
   */
  public static sendCustomerOrderSMS(order: any) {
    const name = order.shippingAddress?.name || 'Customer';
    const orderId = order._id || order.id;
    const payable = order.payable;
    
    const body = `Hi ${name}, your Kalankari order #${orderId} is confirmed! Amount: Rs ${payable}. We are preparing your premium digital print Kurtis in Surat. Thank you!`;
    
    this.logAndSendSMS(order.shippingAddress?.phone, body);
  }

  /**
   * Trigger shipping / delivery SMS
   */
  public static sendOrderStatusSMS(order: any) {
    const name = order.shippingAddress?.name || 'Customer';
    const orderId = order._id || order.id;
    const phone = order.shippingAddress?.phone;

    if (order.status === 'Shipped') {
      const courier = order.courierName || 'Delhivery Express';
      const tracking = order.trackingNumber || 'AWB9876543210';
      const body = `Hi ${name}, your Kalankari order #${orderId} has been shipped via ${courier}! Tracking No: ${tracking}. Track here: https://kalankari.in/dashboard`;
      this.logAndSendSMS(phone, body);
    } else if (order.status === 'Delivered') {
      const body = `Hi ${name}, your Kalankari order #${orderId} has been delivered! We hope you love your kurtis. Write a review: https://kalankari.in/shop/${order.items[0]?.product || ''}`;
      this.logAndSendSMS(phone, body);
    }
  }
}
