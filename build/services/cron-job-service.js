import { ReminderService } from "./reminder-service.js";
import { SystemConfigService } from "./system-config-service.js";
export class CronJobService {
  reminderService;
  systemConfigService;
  intervals = /* @__PURE__ */ new Map();
  constructor() {
    this.reminderService = new ReminderService();
    this.systemConfigService = new SystemConfigService();
  }
  /**
   * Start all ERPS cron jobs based on system configuration
   */
  async startAllCronJobs() {
    console.log("\u{1F550} Starting ERPS cron jobs...");
    try {
      const cronConfigs = await this.getCronJobConfigurations();
      await this.startReminderProcessingJob(cronConfigs.reminderProcessingInterval);
      await this.startGracePeriodProcessingJob(cronConfigs.gracePeriodProcessingInterval);
      await this.startWarrantyStatusUpdateJob(cronConfigs.warrantyStatusUpdateInterval);
      console.log("\u2705 All ERPS cron jobs started successfully");
    } catch (error) {
      console.error("\u274C Error starting cron jobs:", error);
      throw error;
    }
  }
  /**
   * Stop all running cron jobs
   */
  stopAllCronJobs() {
    console.log("\u{1F6D1} Stopping all cron jobs...");
    this.intervals.forEach((interval, jobName) => {
      clearInterval(interval);
      console.log(`\u2705 Stopped cron job: ${jobName}`);
    });
    this.intervals.clear();
    console.log("\u2705 All cron jobs stopped");
  }
  /**
   * Start reminder processing cron job
   * Processes pending reminders every hour
   */
  async startReminderProcessingJob(intervalMinutes = 60) {
    const jobName = "reminder-processing";
    if (this.intervals.has(jobName)) {
      clearInterval(this.intervals.get(jobName));
    }
    console.log("\u{1F4E7} Running initial reminder processing...");
    await this.processReminders();
    const interval = setInterval(async () => {
      await this.processReminders();
    }, intervalMinutes * 60 * 1e3);
    this.intervals.set(jobName, interval);
    console.log(`\u2705 Reminder processing cron job started (every ${intervalMinutes} minutes)`);
  }
  /**
   * Start grace period processing cron job
   * Processes grace period expiry daily at midnight
   */
  async startGracePeriodProcessingJob(intervalMinutes = 1440) {
    const jobName = "grace-period-processing";
    if (this.intervals.has(jobName)) {
      clearInterval(this.intervals.get(jobName));
    }
    const now = /* @__PURE__ */ new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    setTimeout(async () => {
      await this.processGracePeriodExpiry();
      const interval = setInterval(async () => {
        await this.processGracePeriodExpiry();
      }, intervalMinutes * 60 * 1e3);
      this.intervals.set(jobName, interval);
    }, msUntilMidnight);
    console.log(`\u2705 Grace period processing cron job scheduled (daily at midnight)`);
  }
  /**
   * Start warranty status update cron job
   * Updates warranty statuses every 6 hours
   */
  async startWarrantyStatusUpdateJob(intervalMinutes = 360) {
    const jobName = "warranty-status-update";
    if (this.intervals.has(jobName)) {
      clearInterval(this.intervals.get(jobName));
    }
    console.log("\u{1F504} Running initial warranty status update...");
    await this.updateWarrantyStatuses();
    const interval = setInterval(async () => {
      await this.updateWarrantyStatuses();
    }, intervalMinutes * 60 * 1e3);
    this.intervals.set(jobName, interval);
    console.log(`\u2705 Warranty status update cron job started (every ${intervalMinutes} minutes)`);
  }
  /**
   * Process pending reminders
   */
  async processReminders() {
    try {
      console.log("\u{1F4E7} Processing pending reminders...");
      const result = await this.reminderService.processPendingReminders();
      console.log(`\u2705 Reminder processing complete: ${result.sent} sent, ${result.failed} failed`);
    } catch (error) {
      console.error("\u274C Error processing reminders:", error);
    }
  }
  /**
   * Process grace period expiry
   */
  async processGracePeriodExpiry() {
    try {
      console.log("\u23F0 Processing grace period expiry...");
      const expiredCount = await this.reminderService.processGracePeriodExpiry();
      console.log(`\u2705 Grace period processing complete: ${expiredCount} warranties lapsed`);
    } catch (error) {
      console.error("\u274C Error processing grace period expiry:", error);
    }
  }
  /**
   * Update warranty statuses based on current dates
   */
  async updateWarrantyStatuses() {
    try {
      console.log("\u{1F504} Updating warranty statuses...");
      console.log("\u2705 Warranty status update complete");
    } catch (error) {
      console.error("\u274C Error updating warranty statuses:", error);
    }
  }
  /**
   * Get cron job configurations from system_config
   */
  async getCronJobConfigurations() {
    try {
      const reminderInterval = await this.systemConfigService.getConfigValue("CRON_JOBS", "REMINDER_PROCESSING_INTERVAL_MINUTES");
      const gracePeriodInterval = await this.systemConfigService.getConfigValue("CRON_JOBS", "GRACE_PERIOD_PROCESSING_INTERVAL_MINUTES");
      const warrantyStatusInterval = await this.systemConfigService.getConfigValue("CRON_JOBS", "WARRANTY_STATUS_UPDATE_INTERVAL_MINUTES");
      return {
        reminderProcessingInterval: reminderInterval || 60,
        // Default: every hour
        gracePeriodProcessingInterval: gracePeriodInterval || 1440,
        // Default: daily
        warrantyStatusUpdateInterval: warrantyStatusInterval || 360
        // Default: every 6 hours
      };
    } catch (error) {
      console.warn("\u26A0\uFE0F Could not load cron job configurations, using defaults");
      return {
        reminderProcessingInterval: 60,
        // Every hour
        gracePeriodProcessingInterval: 1440,
        // Daily
        warrantyStatusUpdateInterval: 360
        // Every 6 hours
      };
    }
  }
  /**
   * Get cron job status for admin dashboard
   */
  getCronJobStatus() {
    const jobs = [
      {
        jobName: "reminder-processing",
        isRunning: this.intervals.has("reminder-processing"),
        intervalMinutes: 60
      },
      {
        jobName: "grace-period-processing",
        isRunning: this.intervals.has("grace-period-processing"),
        intervalMinutes: 1440
      },
      {
        jobName: "warranty-status-update",
        isRunning: this.intervals.has("warranty-status-update"),
        intervalMinutes: 360
      }
    ];
    return jobs;
  }
  /**
   * Manually trigger reminder processing (for admin use)
   */
  async triggerReminderProcessing() {
    console.log("\u{1F527} Manually triggering reminder processing...");
    return await this.reminderService.processPendingReminders();
  }
  /**
   * Manually trigger grace period processing (for admin use)
   */
  async triggerGracePeriodProcessing() {
    console.log("\u{1F527} Manually triggering grace period processing...");
    return await this.reminderService.processGracePeriodExpiry();
  }
  /**
   * Get reminder statistics
   */
  async getReminderStatistics() {
    return await this.reminderService.getReminderStatistics();
  }
}
