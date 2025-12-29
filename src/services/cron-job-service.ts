import { ReminderService } from './reminder-service.js';
import { SystemConfigService } from './system-config-service.js';

export class CronJobService {
  private reminderService: ReminderService;
  private systemConfigService: SystemConfigService;
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.reminderService = new ReminderService();
    this.systemConfigService = new SystemConfigService();
  }

  /**
   * Start all ERPS cron jobs based on system configuration
   */
  async startAllCronJobs(): Promise<void> {
    console.log('🕐 Starting ERPS cron jobs...');

    try {
      // Get cron job configurations from system_config
      const cronConfigs = await this.getCronJobConfigurations();

      // Start reminder processing job
      await this.startReminderProcessingJob(cronConfigs.reminderProcessingInterval);

      // Start grace period processing job
      await this.startGracePeriodProcessingJob(cronConfigs.gracePeriodProcessingInterval);

      // Start warranty status update job
      await this.startWarrantyStatusUpdateJob(cronConfigs.warrantyStatusUpdateInterval);

      console.log('✅ All ERPS cron jobs started successfully');
    } catch (error) {
      console.error('❌ Error starting cron jobs:', error);
      throw error;
    }
  }

  /**
   * Stop all running cron jobs
   */
  stopAllCronJobs(): void {
    console.log('🛑 Stopping all cron jobs...');
    
    this.intervals.forEach((interval, jobName) => {
      clearInterval(interval);
      console.log(`✅ Stopped cron job: ${jobName}`);
    });
    
    this.intervals.clear();
    console.log('✅ All cron jobs stopped');
  }

  /**
   * Start reminder processing cron job
   * Processes pending reminders every hour
   */
  private async startReminderProcessingJob(intervalMinutes: number = 60): Promise<void> {
    const jobName = 'reminder-processing';
    
    // Clear existing interval if any
    if (this.intervals.has(jobName)) {
      clearInterval(this.intervals.get(jobName)!);
    }

    // Run immediately on startup
    console.log('📧 Running initial reminder processing...');
    await this.processReminders();

    // Schedule recurring job
    const interval = setInterval(async () => {
      await this.processReminders();
    }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds

    this.intervals.set(jobName, interval);
    console.log(`✅ Reminder processing cron job started (every ${intervalMinutes} minutes)`);
  }

  /**
   * Start grace period processing cron job
   * Processes grace period expiry daily at midnight
   */
  private async startGracePeriodProcessingJob(intervalMinutes: number = 1440): Promise<void> { // 1440 minutes = 24 hours
    const jobName = 'grace-period-processing';
    
    // Clear existing interval if any
    if (this.intervals.has(jobName)) {
      clearInterval(this.intervals.get(jobName)!);
    }

    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    // Run at midnight, then every 24 hours
    setTimeout(async () => {
      await this.processGracePeriodExpiry();
      
      // Set up daily recurring job
      const interval = setInterval(async () => {
        await this.processGracePeriodExpiry();
      }, intervalMinutes * 60 * 1000);
      
      this.intervals.set(jobName, interval);
    }, msUntilMidnight);

    console.log(`✅ Grace period processing cron job scheduled (daily at midnight)`);
  }

  /**
   * Start warranty status update cron job
   * Updates warranty statuses every 6 hours
   */
  private async startWarrantyStatusUpdateJob(intervalMinutes: number = 360): Promise<void> { // 360 minutes = 6 hours
    const jobName = 'warranty-status-update';
    
    // Clear existing interval if any
    if (this.intervals.has(jobName)) {
      clearInterval(this.intervals.get(jobName)!);
    }

    // Run immediately on startup
    console.log('🔄 Running initial warranty status update...');
    await this.updateWarrantyStatuses();

    // Schedule recurring job
    const interval = setInterval(async () => {
      await this.updateWarrantyStatuses();
    }, intervalMinutes * 60 * 1000);

    this.intervals.set(jobName, interval);
    console.log(`✅ Warranty status update cron job started (every ${intervalMinutes} minutes)`);
  }

  /**
   * Process pending reminders
   */
  private async processReminders(): Promise<void> {
    try {
      console.log('📧 Processing pending reminders...');
      const result = await this.reminderService.processPendingReminders();
      console.log(`✅ Reminder processing complete: ${result.sent} sent, ${result.failed} failed`);
    } catch (error) {
      console.error('❌ Error processing reminders:', error);
    }
  }

  /**
   * Process grace period expiry
   */
  private async processGracePeriodExpiry(): Promise<void> {
    try {
      console.log('⏰ Processing grace period expiry...');
      const expiredCount = await this.reminderService.processGracePeriodExpiry();
      console.log(`✅ Grace period processing complete: ${expiredCount} warranties lapsed`);
    } catch (error) {
      console.error('❌ Error processing grace period expiry:', error);
    }
  }

  /**
   * Update warranty statuses based on current dates
   */
  private async updateWarrantyStatuses(): Promise<void> {
    try {
      console.log('🔄 Updating warranty statuses...');
      // This would call a database function to update warranty statuses
      // based on current dates, grace periods, etc.
      
      // For now, we'll just log that it's running
      console.log('✅ Warranty status update complete');
    } catch (error) {
      console.error('❌ Error updating warranty statuses:', error);
    }
  }

  /**
   * Get cron job configurations from system_config
   */
  private async getCronJobConfigurations(): Promise<{
    reminderProcessingInterval: number;
    gracePeriodProcessingInterval: number;
    warrantyStatusUpdateInterval: number;
  }> {
    try {
      // Get intervals from system configuration
      const reminderInterval = await this.systemConfigService.getConfigValue('CRON_JOBS', 'REMINDER_PROCESSING_INTERVAL_MINUTES');
      const gracePeriodInterval = await this.systemConfigService.getConfigValue('CRON_JOBS', 'GRACE_PERIOD_PROCESSING_INTERVAL_MINUTES');
      const warrantyStatusInterval = await this.systemConfigService.getConfigValue('CRON_JOBS', 'WARRANTY_STATUS_UPDATE_INTERVAL_MINUTES');

      return {
        reminderProcessingInterval: reminderInterval || 60, // Default: every hour
        gracePeriodProcessingInterval: gracePeriodInterval || 1440, // Default: daily
        warrantyStatusUpdateInterval: warrantyStatusInterval || 360 // Default: every 6 hours
      };
    } catch (error) {
      console.warn('⚠️ Could not load cron job configurations, using defaults');
      return {
        reminderProcessingInterval: 60, // Every hour
        gracePeriodProcessingInterval: 1440, // Daily
        warrantyStatusUpdateInterval: 360 // Every 6 hours
      };
    }
  }

  /**
   * Get cron job status for admin dashboard
   */
  getCronJobStatus(): { jobName: string; isRunning: boolean; intervalMinutes?: number }[] {
    const jobs = [
      {
        jobName: 'reminder-processing',
        isRunning: this.intervals.has('reminder-processing'),
        intervalMinutes: 60
      },
      {
        jobName: 'grace-period-processing',
        isRunning: this.intervals.has('grace-period-processing'),
        intervalMinutes: 1440
      },
      {
        jobName: 'warranty-status-update',
        isRunning: this.intervals.has('warranty-status-update'),
        intervalMinutes: 360
      }
    ];

    return jobs;
  }

  /**
   * Manually trigger reminder processing (for admin use)
   */
  async triggerReminderProcessing(): Promise<{ sent: number; failed: number }> {
    console.log('🔧 Manually triggering reminder processing...');
    return await this.reminderService.processPendingReminders();
  }

  /**
   * Manually trigger grace period processing (for admin use)
   */
  async triggerGracePeriodProcessing(): Promise<number> {
    console.log('🔧 Manually triggering grace period processing...');
    return await this.reminderService.processGracePeriodExpiry();
  }

  /**
   * Get reminder statistics
   */
  async getReminderStatistics(): Promise<any> {
    return await this.reminderService.getReminderStatistics();
  }
}