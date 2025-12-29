import crypto from 'crypto';
import { SMSService } from './smsService.js';
import { EmailService } from './email-service.js';

export interface CustomerActivationToken {
  token: string;
  expiresAt: Date;
  warrantyId: string;
  customerEmail: string;
  customerPhone: string;
}

// Customer activation token expiry: 30 days
const CUSTOMER_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

export class CustomerNotificationService {
  private static activationTokens = new Map<string, CustomerActivationToken>();

  /**
   * Generate customer activation token
   */
  static generateActivationToken(
    warrantyId: string,
    customerEmail: string,
    customerPhone: string
  ): CustomerActivationToken {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + CUSTOMER_TOKEN_EXPIRY_MS);

    const activationData: CustomerActivationToken = {
      token,
      expiresAt,
      warrantyId,
      customerEmail,
      customerPhone
    };

    this.activationTokens.set(token, activationData);
    return activationData;
  }

  /**
   * Send warranty activation email to customer after installer verification
   */
  static async sendCustomerActivationEmail(
    customerEmail: string,
    customerName: string,
    vehicleDetails: string,
    activationToken: string,
    warrantyId: string
  ): Promise<boolean> {
    const activationUrl = `${process.env.FRONTEND_URL}/activate-warranty/${activationToken}`;
    
    const emailService = new EmailService();
    
    try {
      const mailOptions = {
        from: process.env.MAIL_FROM || 'noreply@erps.com.au',
        to: customerEmail,
        subject: 'ERPS Warranty Activation - Action Required',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ERPS Warranty Activation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #059669; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background-color: #f0fdf4; border-radius: 0 0 8px 8px; }
        .vehicle-info { background-color: #dcfce7; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #059669; }
        .activate-button { display: inline-block; background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
        .activate-button:hover { background-color: #047857; }
        .important-notice { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">ERPS</div>
            <h1>Your Warranty is Ready for Activation!</h1>
        </div>
        
        <div class="content">
            <h2>Dear ${customerName},</h2>
            
            <p>Great news! Your ERPS installation has been verified by the installer. Your warranty is now ready to be activated.</p>
            
            <div class="vehicle-info">
                <h3>🚗 Vehicle Details</h3>
                <p><strong>Vehicle:</strong> ${vehicleDetails}</p>
                <p><strong>Warranty ID:</strong> ${warrantyId}</p>
            </div>
            
            <div class="important-notice">
                <h3>⚠️ Action Required</h3>
                <p>To activate your warranty, you must review and accept our terms and conditions. Click the button below to complete the activation process.</p>
            </div>
            
            <div style="text-align: center;">
                <a href="${activationUrl}" class="activate-button">Activate My Warranty</a>
            </div>
            
            <h3>What happens next?</h3>
            <ul>
                <li>Click the activation button above</li>
                <li>Review the warranty terms and conditions</li>
                <li>Accept the terms to activate your warranty</li>
                <li>Receive confirmation of your active warranty</li>
            </ul>
            
            <h3>Important Information</h3>
            <ul>
                <li>This activation link expires in 30 days</li>
                <li>Your warranty will not be active until you complete this step</li>
                <li>Annual inspections are required to maintain warranty coverage</li>
            </ul>
            
            <h3>Need Help?</h3>
            <p>If you have any questions, please contact:</p>
            <ul>
                <li>Email: support@erps.com.au</li>
                <li>Phone: 1800 ERPS (1800 3777)</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>This email was sent automatically by the ERPS system.</p>
            <p>Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} ERPS - Electronic Rust Protection System</p>
        </div>
    </div>
</body>
</html>
        `.trim(),
        text: `
ERPS Warranty Activation - Action Required

Dear ${customerName},

Great news! Your ERPS installation has been verified by the installer. Your warranty is now ready to be activated.

VEHICLE DETAILS:
Vehicle: ${vehicleDetails}
Warranty ID: ${warrantyId}

ACTION REQUIRED:
To activate your warranty, you must review and accept our terms and conditions.

Activate your warranty here: ${activationUrl}

WHAT HAPPENS NEXT:
1. Click the activation link above
2. Review the warranty terms and conditions
3. Accept the terms to activate your warranty
4. Receive confirmation of your active warranty

IMPORTANT INFORMATION:
- This activation link expires in 30 days
- Your warranty will not be active until you complete this step
- Annual inspections are required to maintain warranty coverage

NEED HELP?
Email: support@erps.com.au
Phone: 1800 ERPS (1800 3777)

This email was sent automatically by the ERPS system.
Please do not reply to this email.

© ${new Date().getFullYear()} ERPS - Electronic Rust Protection System
        `.trim()
      };

      // @ts-ignore - accessing private transporter
      const result = await emailService.transporter.sendMail(mailOptions);
      
      if (result.messageId) {
        console.log(`✅ Customer activation email sent to: ${customerEmail}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to send customer activation email:', error);
      return false;
    }
  }

  /**
   * Send SMS reminder to customer about warranty activation
   */
  static async sendCustomerActivationSMS(
    customerPhone: string,
    customerName: string,
    vehicleDetails: string
  ): Promise<boolean> {
    const message = `ERPS Warranty Activation

Hi ${customerName},

Your ERPS installation for ${vehicleDetails} has been verified!

An email has been sent to you with instructions to activate your warranty. Please check your inbox and complete the activation to ensure your warranty coverage is active.

If you haven't received the email, please check your spam folder or contact support@erps.com.au

ERPS Team`;

    try {
      // In development mode, skip actual SMS sending
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV MODE] Would send customer activation SMS to ${customerPhone}`);
        console.log(`[DEV MODE] Message: ${message}`);
        return true;
      }

      // Use Twilio to send SMS
      const twilio = await import('twilio');
      const client = twilio.default(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: SMSService.formatPhoneNumber(customerPhone)
      });

      console.log(`✅ Customer activation SMS sent to: ${customerPhone}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send customer activation SMS:', error);
      return false;
    }
  }

  /**
   * Validate customer activation token
   */
  static validateActivationToken(token: string): CustomerActivationToken | null {
    const activationData = this.activationTokens.get(token);
    
    if (!activationData) {
      return null;
    }

    if (new Date() > activationData.expiresAt) {
      this.activationTokens.delete(token);
      return null;
    }

    return activationData;
  }

  /**
   * Remove activation token after successful activation
   */
  static removeActivationToken(token: string): void {
    this.activationTokens.delete(token);
  }

  /**
   * Clean up expired activation tokens
   */
  static cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [token, data] of this.activationTokens.entries()) {
      if (now > data.expiresAt) {
        this.activationTokens.delete(token);
      }
    }
  }
}

// Clean up expired tokens every hour
setInterval(() => {
  CustomerNotificationService.cleanupExpiredTokens();
}, 60 * 60 * 1000);
