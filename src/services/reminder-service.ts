import { Client } from 'pg';
import { dbConfig } from '../config/database.js';
import { EmailService } from './email-service.js';

export interface ReminderSchedule {
  id: string;
  warrantyId: string;
  customerEmail: string;
  customerName: string;
  reminderType: 'ELEVEN_MONTH' | 'THIRTY_DAY_BEFORE' | 'DUE_DATE' | 'GRACE_PERIOD';
  scheduledDate: Date;
  sentAt?: Date;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  emailContent: string;
  failureReason?: string;
}

export interface WarrantyDates {
  nextDueDate: Date;
  graceEndDate: Date;
  reminder11Month: Date;
  reminder30Day: Date;
}

export class ReminderService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Calculate inspection due dates and reminder dates for a warranty
   */
  async calculateInspectionDates(warrantyId: string): Promise<WarrantyDates> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      const result = await client.query(`
        SELECT * FROM calculate_inspection_dates($1)
      `, [warrantyId]);
      
      if (result.rows.length === 0) {
        throw new Error(`Warranty not found: ${warrantyId}`);
      }
      
      const row = result.rows[0];
      return {
        nextDueDate: new Date(row.next_due_date),
        graceEndDate: new Date(row.grace_end_date),
        reminder11Month: new Date(row.reminder_11_month),
        reminder30Day: new Date(row.reminder_30_day)
      };
      
    } finally {
      await client.end();
    }
  }

  /**
   * Schedule all reminders for a warranty
   */
  async scheduleWarrantyReminders(warrantyId: string): Promise<void> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      // Use the database function to schedule reminders
      await client.query(`SELECT schedule_warranty_reminders($1)`, [warrantyId]);
      
      console.log(`✅ Reminders scheduled for warranty: ${warrantyId}`);
      
    } catch (error) {
      console.error('❌ Error scheduling reminders:', error);
      throw error;
    } finally {
      await client.end();
    }
  }

  /**
   * Get pending reminders that need to be sent today
   */
  async getPendingReminders(): Promise<ReminderSchedule[]> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      const result = await client.query(`
        SELECT 
          id, warranty_id as "warrantyId", customer_email as "customerEmail",
          customer_name as "customerName", reminder_type as "reminderType",
          scheduled_date as "scheduledDate", sent_at as "sentAt",
          status, email_content as "emailContent", failure_reason as "failureReason"
        FROM reminder_schedules
        WHERE status = 'PENDING'
        AND scheduled_date <= CURRENT_DATE
        AND is_deleted = false
        ORDER BY scheduled_date, reminder_type
      `);
      
      return result.rows.map(row => ({
        ...row,
        scheduledDate: new Date(row.scheduledDate),
        sentAt: row.sentAt ? new Date(row.sentAt) : undefined
      }));
      
    } finally {
      await client.end();
    }
  }

  /**
   * Send a specific reminder email
   */
  async sendReminder(reminderId: string): Promise<boolean> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      // Get reminder details
      const reminderResult = await client.query(`
        SELECT 
          rs.*, w.make, w.model, w.vin_number as "vinNumber",
          w.next_inspection_due as "nextInspectionDue",
          pa.business_name as "businessName", pa.phone as "businessPhone"
        FROM reminder_schedules rs
        JOIN warranties w ON rs.warranty_id = w.id
        JOIN partner_accounts pa ON w.partner_account_id = pa.id
        WHERE rs.id = $1 AND rs.status = 'PENDING'
      `, [reminderId]);
      
      if (reminderResult.rows.length === 0) {
        throw new Error(`Reminder not found or already processed: ${reminderId}`);
      }
      
      const reminder = reminderResult.rows[0];
      
      // Prepare email content with vehicle details
      const emailContent = this.generateReminderEmail(reminder);
      
      // Send email
      const emailSent = await this.emailService.sendReminderEmail({
        to: reminder.customer_email,
        subject: this.getReminderSubject(reminder.reminder_type),
        content: emailContent,
        customerName: reminder.customer_name,
        vehicleDetails: {
          make: reminder.make,
          model: reminder.model,
          vinNumber: reminder.vinNumber
        },
        businessDetails: {
          name: reminder.businessName,
          phone: reminder.businessPhone
        }
      });
      
      // Update reminder status
      if (emailSent) {
        await client.query(`
          UPDATE reminder_schedules 
          SET status = 'SENT', sent_at = CURRENT_TIMESTAMP, email_content = $2
          WHERE id = $1
        `, [reminderId, emailContent]);
        
        // Update warranty last reminder sent
        await client.query(`
          UPDATE warranties 
          SET last_reminder_sent = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [reminder.warranty_id]);
        
        console.log(`✅ Reminder sent successfully: ${reminderId}`);
        return true;
      } else {
        await client.query(`
          UPDATE reminder_schedules 
          SET status = 'FAILED', failure_reason = 'Email delivery failed'
          WHERE id = $1
        `, [reminderId]);
        
        console.log(`❌ Reminder failed to send: ${reminderId}`);
        return false;
      }
      
    } catch (error) {
      // Mark as failed
      await client.query(`
        UPDATE reminder_schedules 
        SET status = 'FAILED', failure_reason = $2
        WHERE id = $1
      `, [reminderId, error.message]);
      
      console.error('❌ Error sending reminder:', error);
      return false;
    } finally {
      await client.end();
    }
  }

  /**
   * Process all pending reminders (called by cron job)
   */
  async processPendingReminders(): Promise<{ sent: number; failed: number }> {
    const pendingReminders = await this.getPendingReminders();
    let sent = 0;
    let failed = 0;
    
    console.log(`📧 Processing ${pendingReminders.length} pending reminders...`);
    
    for (const reminder of pendingReminders) {
      const success = await this.sendReminder(reminder.id);
      if (success) {
        sent++;
      } else {
        failed++;
      }
      
      // Small delay to avoid overwhelming email service
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`✅ Reminder processing complete: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  /**
   * Process grace period expiry (called by cron job)
   */
  async processGracePeriodExpiry(): Promise<number> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      const result = await client.query(`SELECT process_grace_period_expiry()`);
      const expiredCount = result.rows[0].process_grace_period_expiry;
      
      console.log(`⏰ Grace period expiry processed: ${expiredCount} warranties lapsed`);
      return expiredCount;
      
    } finally {
      await client.end();
    }
  }

  /**
   * Cancel reminders for a warranty (when inspection is completed)
   */
  async cancelWarrantyReminders(warrantyId: string): Promise<void> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      await client.query(`
        UPDATE reminder_schedules 
        SET status = 'CANCELLED'
        WHERE warranty_id = $1 AND status = 'PENDING'
      `, [warrantyId]);
      
      console.log(`✅ Reminders cancelled for warranty: ${warrantyId}`);
      
    } finally {
      await client.end();
    }
  }

  /**
   * Get reminder statistics for admin dashboard
   */
  async getReminderStatistics(): Promise<any> {
    const client = new Client(dbConfig);
    
    try {
      await client.connect();
      
      const result = await client.query(`
        SELECT 
          COUNT(*) as total_reminders,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_reminders,
          COUNT(CASE WHEN status = 'SENT' THEN 1 END) as sent_reminders,
          COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_reminders,
          COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_reminders,
          COUNT(CASE WHEN scheduled_date <= CURRENT_DATE AND status = 'PENDING' THEN 1 END) as overdue_reminders
        FROM reminder_schedules
        WHERE is_deleted = false
      `);
      
      return result.rows[0];
      
    } finally {
      await client.end();
    }
  }

  /**
   * Generate reminder email content based on type
   */
  private generateReminderEmail(reminder: any): string {
    const vehicleInfo = `${reminder.make} ${reminder.model} (VIN: ${reminder.vinNumber})`;
    const businessInfo = `${reminder.businessName} (${reminder.businessPhone})`;
    
    switch (reminder.reminder_type) {
      case '11_MONTH':
        return `
Dear ${reminder.customer_name},

Your ERPS annual inspection is due in approximately 1 month for your ${vehicleInfo}.

To maintain your warranty coverage, please contact your ERPS installer to schedule your annual inspection:

${businessInfo}

Your inspection is due by: ${new Date(reminder.nextInspectionDue).toLocaleDateString()}

Important: Failure to complete your annual inspection within the grace period will result in warranty lapse.

Best regards,
ERPS Team
        `.trim();
        
      case '30_DAY_BEFORE':
        return `
Dear ${reminder.customer_name},

URGENT: Your ERPS annual inspection is due in 30 days for your ${vehicleInfo}.

Please contact your ERPS installer immediately to schedule your inspection:

${businessInfo}

Your inspection is due by: ${new Date(reminder.nextInspectionDue).toLocaleDateString()}

Warning: You have a 30-day grace period after the due date. Failure to complete the inspection will result in warranty lapse.

Best regards,
ERPS Team
        `.trim();
        
      case 'DUE_DATE':
        return `
Dear ${reminder.customer_name},

FINAL NOTICE: Your ERPS annual inspection is DUE TODAY for your ${vehicleInfo}.

Contact your ERPS installer immediately:

${businessInfo}

Due date: ${new Date(reminder.nextInspectionDue).toLocaleDateString()}

You have 30 days from today to complete the inspection before your warranty lapses permanently.

Best regards,
ERPS Team
        `.trim();
        
      default:
        return reminder.email_content || 'ERPS inspection reminder';
    }
  }

  /**
   * Get email subject based on reminder type
   */
  private getReminderSubject(reminderType: string): string {
    switch (reminderType) {
      case '11_MONTH':
        return 'ERPS Annual Inspection Due in 1 Month';
      case '30_DAY_BEFORE':
        return 'URGENT: ERPS Annual Inspection Due in 30 Days';
      case 'DUE_DATE':
        return 'FINAL NOTICE: ERPS Annual Inspection Due TODAY';
      default:
        return 'ERPS Annual Inspection Reminder';
    }
  }
}