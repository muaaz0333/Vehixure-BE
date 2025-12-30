import twilio from "twilio";
import crypto from "crypto";
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);
export class SMSService {
  /**
   * Generate a secure verification token
   */
  static generateVerificationToken() {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = /* @__PURE__ */ new Date();
    expires.setDate(expires.getDate() + 60);
    return { token, expires };
  }
  /**
   * Send warranty verification SMS to installer
   */
  static async sendWarrantyVerificationSMS(mobileNumber, installerName, customerName, vehicleDetails, verificationToken) {
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
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV MODE] Would send warranty verification SMS to ${mobileNumber}`);
        console.log(`[DEV MODE] Message: ${message}`);
        console.log(`[DEV MODE] SMS sending skipped in development mode`);
        return;
      }
      await client.messages.create({
        body: message,
        from: fromNumber,
        to: mobileNumber
      });
      console.log(`Warranty verification SMS sent to ${mobileNumber}`);
    } catch (error) {
      console.error("Failed to send warranty verification SMS:", error);
      throw new Error("Failed to send verification SMS");
    }
  }
  /**
   * Send inspection verification SMS to inspector
   */
  static async sendInspectionVerificationSMS(mobileNumber, inspectorName, customerName, vehicleDetails, verificationToken) {
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
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV MODE] Would send inspection verification SMS to ${mobileNumber}`);
        console.log(`[DEV MODE] Message: ${message}`);
        console.log(`[DEV MODE] SMS sending skipped in development mode`);
        return;
      }
      await client.messages.create({
        body: message,
        from: fromNumber,
        to: mobileNumber
      });
      console.log(`Inspection verification SMS sent to ${mobileNumber}`);
    } catch (error) {
      console.error("Failed to send inspection verification SMS:", error);
      throw new Error("Failed to send verification SMS");
    }
  }
  /**
   * Send warranty reminder SMS
   */
  static async sendWarrantyReminderSMS(mobileNumber, customerName, vehicleDetails, dueDate) {
    const message = `ERPS Annual Inspection Reminder

Hi ${customerName},

Your annual inspection is due for:
Vehicle: ${vehicleDetails}
Due Date: ${dueDate}

Please contact your ERPS installer to schedule your inspection.

ERPS Team`;
    try {
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV MODE] Would send warranty reminder SMS to ${mobileNumber}`);
        console.log(`[DEV MODE] Message: ${message}`);
        console.log(`[DEV MODE] SMS sending skipped in development mode`);
        return;
      }
      await client.messages.create({
        body: message,
        from: fromNumber,
        to: mobileNumber
      });
      console.log(`Warranty reminder SMS sent to ${mobileNumber}`);
    } catch (error) {
      console.error("Failed to send warranty reminder SMS:", error);
      throw new Error("Failed to send reminder SMS");
    }
  }
  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phoneNumber) {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }
  /**
   * Format phone number for SMS (ensure it starts with +)
   */
  static formatPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (!phoneNumber.startsWith("+")) {
      if (cleaned.startsWith("0")) {
        return `+61${cleaned.substring(1)}`;
      } else if (cleaned.startsWith("61")) {
        return `+${cleaned}`;
      } else {
        return `+61${cleaned}`;
      }
    }
    return phoneNumber;
  }
}
