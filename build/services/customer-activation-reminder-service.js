import { AppDataSource } from "../plugins/typeorm.js";
import { Warranty } from "../entities/Warranty.js";
import { AuditHistory } from "../entities/AuditHistory.js";
import { VerificationTokenService } from "./verification-token-service.js";
export class CustomerActivationReminderService {
  /**
   * Process all pending customer activation reminders
   * Sends reminders to customers who haven't activated their warranty after installer verification
   */
  async processActivationReminders() {
    const result = {
      sent: 0,
      skipped: 0,
      failed: 0,
      details: []
    };
    try {
      const pendingTokens = await VerificationTokenService.getPendingActivationTokensForReminder();
      console.log(`\u{1F4E7} Processing ${pendingTokens.length} customer activation reminders...`);
      for (const token of pendingTokens) {
        try {
          const warrantyRepo = AppDataSource.getRepository(Warranty);
          const warranty = await warrantyRepo.findOne({
            where: { id: token.recordId, isDeleted: false }
          });
          if (!warranty) {
            result.skipped++;
            result.details.push({
              warrantyId: token.recordId,
              customerEmail: token.customerEmail || "unknown",
              status: "skipped",
              reason: "Warranty not found"
            });
            continue;
          }
          if (warranty.verificationStatus !== "PENDING_CUSTOMER_ACTIVATION") {
            result.skipped++;
            result.details.push({
              warrantyId: warranty.id,
              customerEmail: warranty.email,
              status: "skipped",
              reason: `Warranty status is ${warranty.verificationStatus}, not pending activation`
            });
            await VerificationTokenService.markTokenAsUsed(token.token);
            continue;
          }
          const reminderNumber = token.remindersSent + 1;
          const success = await this.sendActivationReminder(
            warranty,
            token.token,
            reminderNumber
          );
          if (success) {
            await VerificationTokenService.updateReminderSent(token.id);
            await this.logReminderSent(warranty.id, reminderNumber);
            result.sent++;
            result.details.push({
              warrantyId: warranty.id,
              customerEmail: warranty.email,
              status: "sent",
              reason: `Reminder #${reminderNumber} sent`
            });
          } else {
            result.failed++;
            result.details.push({
              warrantyId: warranty.id,
              customerEmail: warranty.email,
              status: "failed",
              reason: "Failed to send reminder"
            });
          }
          await new Promise((resolve) => setTimeout(resolve, 1e3));
        } catch (error) {
          console.error(`\u274C Error processing reminder for token ${token.id}:`, error);
          result.failed++;
          result.details.push({
            warrantyId: token.recordId,
            customerEmail: token.customerEmail || "unknown",
            status: "failed",
            reason: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      return result;
    } catch (error) {
      console.error("\u274C Error in processActivationReminders:", error);
      throw error;
    }
  }
  /**
   * Send activation reminder to customer
   */
  async sendActivationReminder(warranty, activationToken, reminderNumber) {
    try {
      const customerName = `${warranty.firstName} ${warranty.lastName}`;
      const vehicleDetails = `${warranty.make} ${warranty.model} (${warranty.vinNumber})`;
      const emailSent = await this.sendReminderEmail(
        warranty.email,
        customerName,
        vehicleDetails,
        activationToken,
        warranty.id,
        reminderNumber
      );
      const smsSent = await this.sendReminderSMS(
        warranty.phoneNumber,
        customerName,
        vehicleDetails,
        reminderNumber
      );
      return emailSent || smsSent;
    } catch (error) {
      console.error("\u274C Error sending activation reminder:", error);
      return false;
    }
  }
  /**
   * Send reminder email to customer
   */
  async sendReminderEmail(customerEmail, customerName, vehicleDetails, activationToken, warrantyId, reminderNumber) {
    const activationUrl = `${process.env.FRONTEND_URL}/activate-warranty/${activationToken}`;
    const urgencyText = reminderNumber === 1 ? "Friendly Reminder" : reminderNumber === 2 ? "Second Reminder" : "Final Reminder - Action Required";
    const { EmailService } = await import("./email-service.js");
    const emailService = new EmailService();
    try {
      const mailOptions = {
        from: process.env.MAIL_FROM || "noreply@erps.com.au",
        to: customerEmail,
        subject: `ERPS Warranty Activation - ${urgencyText}`,
        html: this.generateReminderEmailHtml(
          customerName,
          vehicleDetails,
          warrantyId,
          activationUrl,
          reminderNumber
        ),
        text: this.generateReminderEmailText(
          customerName,
          vehicleDetails,
          warrantyId,
          activationUrl,
          reminderNumber
        )
      };
      const result = await emailService.transporter.sendMail(mailOptions);
      if (result.messageId) {
        console.log(`\u2705 Activation reminder email #${reminderNumber} sent to: ${customerEmail}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error("\u274C Failed to send activation reminder email:", error);
      return false;
    }
  }
  /**
   * Send reminder SMS to customer
   */
  async sendReminderSMS(customerPhone, customerName, vehicleDetails, reminderNumber) {
    const urgencyText = reminderNumber === 1 ? "Reminder" : reminderNumber === 2 ? "Second Reminder" : "FINAL REMINDER";
    const message = `ERPS ${urgencyText}

Hi ${customerName},

Your ERPS warranty for ${vehicleDetails} is waiting to be activated!

Please check your email and click the activation link to complete your warranty registration.

Your warranty will NOT be active until you accept the terms.

ERPS Team`;
    try {
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV MODE] Would send activation reminder SMS #${reminderNumber} to ${customerPhone}`);
        return true;
      }
      const { SMSService } = await import("./smsService.js");
      const twilio = await import("twilio");
      const client = twilio.default(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: SMSService.formatPhoneNumber(customerPhone)
      });
      console.log(`\u2705 Activation reminder SMS #${reminderNumber} sent to: ${customerPhone}`);
      return true;
    } catch (error) {
      console.error("\u274C Failed to send activation reminder SMS:", error);
      return false;
    }
  }
  /**
   * Generate reminder email HTML content
   */
  generateReminderEmailHtml(customerName, vehicleDetails, warrantyId, activationUrl, reminderNumber) {
    const urgencyColor = reminderNumber === 3 ? "#dc2626" : "#f59e0b";
    const urgencyText = reminderNumber === 1 ? "Friendly Reminder" : reminderNumber === 2 ? "Second Reminder" : "\u26A0\uFE0F Final Reminder - Action Required";
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ERPS Warranty Activation Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: ${urgencyColor}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">ERPS</div>
            <h1 style="margin: 0;">${urgencyText}</h1>
        </div>
        
        <div style="padding: 30px; background-color: #fffbeb; border-radius: 0 0 8px 8px;">
            <h2>Dear ${customerName},</h2>
            
            <p>Your ERPS installation has been verified by the installer, but <strong>your warranty is not yet active</strong>.</p>
            
            <div style="background-color: #fef3c7; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid ${urgencyColor};">
                <h3>\u{1F697} Vehicle Details</h3>
                <p><strong>Vehicle:</strong> ${vehicleDetails}</p>
                <p><strong>Warranty ID:</strong> ${warrantyId}</p>
            </div>
            
            <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <h3>\u26A0\uFE0F Important</h3>
                <p>Your warranty coverage will <strong>NOT be active</strong> until you accept the terms and conditions.</p>
                ${reminderNumber === 3 ? "<p><strong>This is your final reminder.</strong> Please activate your warranty as soon as possible.</p>" : ""}
            </div>
            
            <div style="text-align: center;">
                <a href="${activationUrl}" style="display: inline-block; background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold;">Activate My Warranty Now</a>
            </div>
            
            <h3>Need Help?</h3>
            <p>If you have any questions or issues activating your warranty, please contact:</p>
            <ul>
                <li>Email: support@erps.com.au</li>
                <li>Phone: 1800 ERPS (1800 3777)</li>
            </ul>
        </div>
        
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
            <p>This is reminder ${reminderNumber} of 3.</p>
            <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} ERPS - Electronic Rust Protection System</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }
  /**
   * Generate reminder email text content
   */
  generateReminderEmailText(customerName, vehicleDetails, warrantyId, activationUrl, reminderNumber) {
    const urgencyText = reminderNumber === 1 ? "FRIENDLY REMINDER" : reminderNumber === 2 ? "SECOND REMINDER" : "FINAL REMINDER - ACTION REQUIRED";
    return `
ERPS WARRANTY ACTIVATION - ${urgencyText}

Dear ${customerName},

Your ERPS installation has been verified by the installer, but your warranty is NOT yet active.

VEHICLE DETAILS:
Vehicle: ${vehicleDetails}
Warranty ID: ${warrantyId}

IMPORTANT:
Your warranty coverage will NOT be active until you accept the terms and conditions.
${reminderNumber === 3 ? "This is your final reminder. Please activate your warranty as soon as possible." : ""}

Activate your warranty here: ${activationUrl}

NEED HELP?
Email: support@erps.com.au
Phone: 1800 ERPS (1800 3777)

This is reminder ${reminderNumber} of 3.

\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} ERPS - Electronic Rust Protection System
    `.trim();
  }
  /**
   * Log reminder sent to audit history
   */
  async logReminderSent(warrantyId, reminderNumber) {
    try {
      const auditRepo = AppDataSource.getRepository(AuditHistory);
      await auditRepo.save({
        warrantyId,
        actionType: "CUSTOMER_ACTIVATION_REMINDER_SENT",
        recordType: "WARRANTY",
        versionNumber: 1,
        performedBy: "SYSTEM",
        performedAt: /* @__PURE__ */ new Date(),
        notes: `Customer activation reminder #${reminderNumber} sent`,
        isCurrentVersion: true
      });
    } catch (error) {
      console.error("\u274C Error logging reminder to audit history:", error);
    }
  }
}
