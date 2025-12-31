import { AppDataSource } from '../plugins/typeorm.js';
import { Warranty } from '../entities/Warranty.js';
import { AuditHistory } from '../entities/AuditHistory.js';
import { VerificationTokenService } from './verification-token-service.js';
import { CustomerNotificationService } from './customer-notification-service.js';

export interface ActivationReminderResult {
  sent: number;
  skipped: number;
  failed: number;
  details: Array<{
    warrantyId: string;
    customerEmail: string;
    status: 'sent' | 'skipped' | 'failed';
    reason?: string;
  }>;
}

export class CustomerActivationReminderService {
  
  /**
   * Process all pending customer activation reminders
   * Sends reminders to customers who haven't activated their warranty after installer verification
   */
  async processActivationReminders(): Promise<ActivationReminderResult> {
    const result: ActivationReminderResult = {
      sent: 0,
      skipped: 0,
      failed: 0,
      details: []
    };

    try {
      // Get all pending activation tokens that need reminders
      const pendingTokens = await VerificationTokenService.getPendingActivationTokensForReminder();
      
      console.log(`📧 Processing ${pendingTokens.length} customer activation reminders...`);
      
      for (const token of pendingTokens) {
        try {
          // Get warranty details
          const warrantyRepo = AppDataSource.getRepository(Warranty);
          const warranty = await warrantyRepo.findOne({
            where: { id: token.recordId, isDeleted: false }
          });
          
          if (!warranty) {
            result.skipped++;
            result.details.push({
              warrantyId: token.recordId,
              customerEmail: token.customerEmail || 'unknown',
              status: 'skipped',
              reason: 'Warranty not found'
            });
            continue;
          }
          
          // Check if warranty is still pending customer activation
          if (warranty.verificationStatus !== 'PENDING_CUSTOMER_ACTIVATION') {
            result.skipped++;
            result.details.push({
              warrantyId: warranty.id,
              customerEmail: warranty.email,
              status: 'skipped',
              reason: `Warranty status is ${warranty.verificationStatus}, not pending activation`
            });
            // Mark token as used since warranty status changed
            await VerificationTokenService.markTokenAsUsed(token.token);
            continue;
          }
          
          // Send reminder based on how many have been sent
          const reminderNumber = token.remindersSent + 1;
          const success = await this.sendActivationReminder(
            warranty,
            token.token,
            reminderNumber
          );
          
          if (success) {
            // Update reminder count
            await VerificationTokenService.updateReminderSent(token.id);
            
            // Log to audit history
            await this.logReminderSent(warranty.id, reminderNumber);
            
            result.sent++;
            result.details.push({
              warrantyId: warranty.id,
              customerEmail: warranty.email,
              status: 'sent',
              reason: `Reminder #${reminderNumber} sent`
            });
          } else {
            result.failed++;
            result.details.push({
              warrantyId: warranty.id,
              customerEmail: warranty.email,
              status: 'failed',
              reason: 'Failed to send reminder'
            });
          }
          
          // Small delay to avoid overwhelming email/SMS services
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`❌ Error processing reminder for token ${token.id}:`, error);
          result.failed++;
          result.details.push({
            warrantyId: token.recordId,
            customerEmail: token.customerEmail || 'unknown',
            status: 'failed',
            reason: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Error in processActivationReminders:', error);
      throw error;
    }
  }

  /**
   * Send activation reminder to customer
   */
  private async sendActivationReminder(
    warranty: Warranty,
    activationToken: string,
    reminderNumber: number
  ): Promise<boolean> {
    try {
      const customerName = `${warranty.firstName} ${warranty.lastName}`;
      const vehicleDetails = `${warranty.make} ${warranty.model} (${warranty.vinNumber})`;
      
      // Send email reminder
      const emailSent = await this.sendReminderEmail(
        warranty.email,
        customerName,
        vehicleDetails,
        activationToken,
        warranty.id,
        reminderNumber
      );
      
      // Send SMS reminder
      const smsSent = await this.sendReminderSMS(
        warranty.phoneNumber,
        customerName,
        vehicleDetails,
        reminderNumber
      );
      
      return emailSent || smsSent;
      
    } catch (error) {
      console.error('❌ Error sending activation reminder:', error);
      return false;
    }
  }

  /**
   * Send reminder email to customer
   */
  private async sendReminderEmail(
    customerEmail: string,
    customerName: string,
    vehicleDetails: string,
    activationToken: string,
    warrantyId: string,
    reminderNumber: number
  ): Promise<boolean> {
    const activationUrl = `${process.env.FRONTEND_URL}/activate-warranty/${activationToken}`;
    
    const urgencyText = reminderNumber === 1 
      ? 'Friendly Reminder'
      : reminderNumber === 2 
        ? 'Second Reminder'
        : 'Final Reminder - Action Required';
    
    const { EmailService } = await import('./email-service.js');
    const emailService = new EmailService();
    
    try {
      const mailOptions = {
        from: process.env.MAIL_FROM || 'noreply@erps.com.au',
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

      // @ts-ignore - accessing private transporter
      const result = await emailService.transporter.sendMail(mailOptions);
      
      if (result.messageId) {
        console.log(`✅ Activation reminder email #${reminderNumber} sent to: ${customerEmail}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to send activation reminder email:', error);
      return false;
    }
  }

  /**
   * Send reminder SMS to customer
   */
  private async sendReminderSMS(
    customerPhone: string,
    customerName: string,
    vehicleDetails: string,
    reminderNumber: number
  ): Promise<boolean> {
    const urgencyText = reminderNumber === 1 
      ? 'Reminder'
      : reminderNumber === 2 
        ? 'Second Reminder'
        : 'FINAL REMINDER';
    
    const message = `ERPS ${urgencyText}

Hi ${customerName},

Your ERPS warranty for ${vehicleDetails} is waiting to be activated!

Please check your email and click the activation link to complete your warranty registration.

Your warranty will NOT be active until you accept the terms.

ERPS Team`;

    try {
      // In development mode, skip actual SMS sending
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV MODE] Would send activation reminder SMS #${reminderNumber} to ${customerPhone}`);
        return true;
      }

      const { SMSService } = await import('./smsService.js');
      
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

      console.log(`✅ Activation reminder SMS #${reminderNumber} sent to: ${customerPhone}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send activation reminder SMS:', error);
      return false;
    }
  }

  /**
   * Generate reminder email HTML content
   */
  private generateReminderEmailHtml(
    customerName: string,
    vehicleDetails: string,
    warrantyId: string,
    activationUrl: string,
    reminderNumber: number
  ): string {
    const urgencyColor = reminderNumber === 3 ? '#dc2626' : '#f59e0b';
    const urgencyText = reminderNumber === 1 
      ? 'Friendly Reminder'
      : reminderNumber === 2 
        ? 'Second Reminder'
        : '⚠️ Final Reminder - Action Required';
    
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
                <h3>🚗 Vehicle Details</h3>
                <p><strong>Vehicle:</strong> ${vehicleDetails}</p>
                <p><strong>Warranty ID:</strong> ${warrantyId}</p>
            </div>
            
            <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <h3>⚠️ Important</h3>
                <p>Your warranty coverage will <strong>NOT be active</strong> until you accept the terms and conditions.</p>
                ${reminderNumber === 3 ? '<p><strong>This is your final reminder.</strong> Please activate your warranty as soon as possible.</p>' : ''}
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
            <p>&copy; ${new Date().getFullYear()} ERPS - Electronic Rust Protection System</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate reminder email text content
   */
  private generateReminderEmailText(
    customerName: string,
    vehicleDetails: string,
    warrantyId: string,
    activationUrl: string,
    reminderNumber: number
  ): string {
    const urgencyText = reminderNumber === 1 
      ? 'FRIENDLY REMINDER'
      : reminderNumber === 2 
        ? 'SECOND REMINDER'
        : 'FINAL REMINDER - ACTION REQUIRED';
    
    return `
ERPS WARRANTY ACTIVATION - ${urgencyText}

Dear ${customerName},

Your ERPS installation has been verified by the installer, but your warranty is NOT yet active.

VEHICLE DETAILS:
Vehicle: ${vehicleDetails}
Warranty ID: ${warrantyId}

IMPORTANT:
Your warranty coverage will NOT be active until you accept the terms and conditions.
${reminderNumber === 3 ? 'This is your final reminder. Please activate your warranty as soon as possible.' : ''}

Activate your warranty here: ${activationUrl}

NEED HELP?
Email: support@erps.com.au
Phone: 1800 ERPS (1800 3777)

This is reminder ${reminderNumber} of 3.

© ${new Date().getFullYear()} ERPS - Electronic Rust Protection System
    `.trim();
  }

  /**
   * Log reminder sent to audit history
   */
  private async logReminderSent(warrantyId: string, reminderNumber: number): Promise<void> {
    try {
      const auditRepo = AppDataSource.getRepository(AuditHistory);
      
      await auditRepo.save({
        warrantyId,
        actionType: 'CUSTOMER_ACTIVATION_REMINDER_SENT',
        recordType: 'WARRANTY',
        versionNumber: 1,
        performedBy: 'SYSTEM',
        performedAt: new Date(),
        notes: `Customer activation reminder #${reminderNumber} sent`,
        isCurrentVersion: true
      });
    } catch (error) {
      console.error('❌ Error logging reminder to audit history:', error);
    }
  }
}
