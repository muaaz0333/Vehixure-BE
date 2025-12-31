import twilio from 'twilio';
import crypto from 'crypto';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export interface VerificationTokenData {
  token: string;
  expires: Date;
}

export class SMSService {
  /**
   * Generate a secure verification token
   */
  static generateVerificationToken(): VerificationTokenData {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setDate(expires.getDate() + 60); // Token expires in 60 days per client requirement
    
    return { token, expires };
  }

  /**
   * Send a test SMS to verify Twilio configuration
   */
  static async sendTestSMS(mobileNumber: string): Promise<{ success: boolean; message: string; sid?: string }> {
    const message = `ERPS Test SMS

This is a test message from ERPS system.
If you received this, SMS functionality is working correctly!

Timestamp: ${new Date().toISOString()}

ERPS Team`;

    try {
      const result = await client.messages.create({
        body: message,
        from: fromNumber,
        to: mobileNumber,
      });
      
      console.log(`✅ Test SMS sent to ${mobileNumber}, SID: ${result.sid}`);
      return { 
        success: true, 
        message: `Test SMS sent successfully to ${mobileNumber}`,
        sid: result.sid 
      };
    } catch (error: any) {
      console.error('❌ Failed to send test SMS:', error);
      return { 
        success: false, 
        message: `Failed to send SMS: ${error.message}` 
      };
    }
  }

  /**
   * Send warranty verification SMS to installer
   */
  static async sendWarrantyVerificationSMS(
    mobileNumber: string,
    installerName: string,
    customerName: string,
    vehicleDetails: string,
    verificationToken: string
  ): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-warranty/${verificationToken}`;
    
    const message = `ERPS Warranty Verification Required

Hi ${installerName},

A warranty registration requires your verification:
Customer: ${customerName}
Vehicle: ${vehicleDetails}

You must verify this warranty as you are listed as the installer.

Verify now: ${verificationUrl}

This link expires in 60 days.

ERPS Team`;

    try {
      // In development mode, skip actual SMS sending for testing
      if (process.env.NODE_ENV === 'development' && !process.env.FORCE_SMS_SEND) {
        console.log(`[DEV MODE] Would send warranty verification SMS to ${mobileNumber}`);
        console.log(`[DEV MODE] Message: ${message}`);
        console.log(`[DEV MODE] SMS sending skipped in development mode`);
        return;
      }
      
      await client.messages.create({
        body: message,
        from: fromNumber,
        to: mobileNumber,
      });
      
      console.log(`Warranty verification SMS sent to ${mobileNumber}`);
    } catch (error) {
      console.error('Failed to send warranty verification SMS:', error);
      throw new Error('Failed to send verification SMS');
    }
  }

  /**
   * Send inspection verification SMS to inspector
   */
  static async sendInspectionVerificationSMS(
    mobileNumber: string,
    inspectorName: string,
    customerName: string,
    vehicleDetails: string,
    verificationToken: string
  ): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-inspection/${verificationToken}`;
    
    const message = `ERPS Annual Inspection Verification Required

Hi ${inspectorName},

An annual inspection requires your verification:
Customer: ${customerName}
Vehicle: ${vehicleDetails}

You must verify this inspection as you performed it.

Verify now: ${verificationUrl}

This link expires in 60 days.

ERPS Team`;

    try {
      // In development mode, skip actual SMS sending for testing
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV MODE] Would send inspection verification SMS to ${mobileNumber}`);
        console.log(`[DEV MODE] Message: ${message}`);
        console.log(`[DEV MODE] SMS sending skipped in development mode`);
        return;
      }
      
      await client.messages.create({
        body: message,
        from: fromNumber,
        to: mobileNumber,
      });
      
      console.log(`Inspection verification SMS sent to ${mobileNumber}`);
    } catch (error) {
      console.error('Failed to send inspection verification SMS:', error);
      throw new Error('Failed to send verification SMS');
    }
  }

  /**
   * Send warranty reminder SMS
   */
  static async sendWarrantyReminderSMS(
    mobileNumber: string,
    customerName: string,
    vehicleDetails: string,
    dueDate: string
  ): Promise<void> {
    const message = `ERPS Annual Inspection Reminder

Hi ${customerName},

Your annual inspection is due for:
Vehicle: ${vehicleDetails}
Due Date: ${dueDate}

Please contact your ERPS installer to schedule your inspection.

ERPS Team`;

    try {
      // In development mode, skip actual SMS sending for testing
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV MODE] Would send warranty reminder SMS to ${mobileNumber}`);
        console.log(`[DEV MODE] Message: ${message}`);
        console.log(`[DEV MODE] SMS sending skipped in development mode`);
        return;
      }
      
      await client.messages.create({
        body: message,
        from: fromNumber,
        to: mobileNumber,
      });
      
      console.log(`Warranty reminder SMS sent to ${mobileNumber}`);
    } catch (error) {
      console.error('Failed to send warranty reminder SMS:', error);
      throw new Error('Failed to send reminder SMS');
    }
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    // Basic validation for international phone numbers
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number for SMS (ensure it starts with +)
   */
  static formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it doesn't start with country code, assume it's Australian (+61)
    if (!phoneNumber.startsWith('+')) {
      if (cleaned.startsWith('0')) {
        // Australian mobile starting with 0, replace with +61
        return `+61${cleaned.substring(1)}`;
      } else if (cleaned.startsWith('61')) {
        // Already has country code but missing +
        return `+${cleaned}`;
      } else {
        // Assume Australian number without country code
        return `+61${cleaned}`;
      }
    }
    
    return phoneNumber;
  }
}