import cron from "node-cron";
import { ReminderService } from "./reminder-service.js";
import { CustomerActivationReminderService } from "./customer-activation-reminder-service.js";
import { VerificationTokenService } from "./verification-token-service.js";
export class CronService {
  reminderService;
  customerActivationReminderService;
  jobs = /* @__PURE__ */ new Map();
  jobRunningStatus = /* @__PURE__ */ new Map();
  constructor() {
    this.reminderService = new ReminderService();
    this.customerActivationReminderService = new CustomerActivationReminderService();
  }
  /**
   * Start all cron jobs
   */
  startAllJobs() {
    console.log("\u{1F550} Starting ERPS cron jobs...");
    this.startReminderProcessingJob();
    this.startGracePeriodProcessingJob();
    this.startCustomerActivationReminderJob();
    this.startTokenCleanupJob();
    this.startDailyMaintenanceJob();
    console.log("\u2705 All cron jobs started successfully");
  }
  /**
   * Stop all cron jobs
   */
  stopAllJobs() {
    console.log("\u{1F6D1} Stopping all cron jobs...");
    this.jobs.forEach((job, name) => {
      job.stop();
      this.jobRunningStatus.set(name, false);
      console.log(`   Stopped: ${name}`);
    });
    this.jobs.clear();
    this.jobRunningStatus.clear();
    console.log("\u2705 All cron jobs stopped");
  }
  /**
   * Process pending reminders every hour
   * Sends inspection due reminders (11-month, 30-day, due date)
   */
  startReminderProcessingJob() {
    const job = cron.schedule("0 * * * *", async () => {
      console.log("\u{1F550} Running hourly reminder processing...");
      try {
        const result = await this.reminderService.processPendingReminders();
        console.log(`\u2705 Reminder processing complete: ${result.sent} sent, ${result.failed} failed`);
      } catch (error) {
        console.error("\u274C Error in reminder processing job:", error);
      }
    }, {
      timezone: "Australia/Sydney"
    });
    this.jobs.set("reminder-processing", job);
    this.jobRunningStatus.set("reminder-processing", true);
    console.log("   \u2705 Reminder processing job scheduled (hourly)");
  }
  /**
   * Process grace period expiry daily at 2 AM
   */
  startGracePeriodProcessingJob() {
    const job = cron.schedule("0 2 * * *", async () => {
      console.log("\u{1F550} Running daily grace period processing...");
      try {
        const expiredCount = await this.reminderService.processGracePeriodExpiry();
        console.log(`\u2705 Grace period processing complete: ${expiredCount} warranties lapsed`);
      } catch (error) {
        console.error("\u274C Error in grace period processing job:", error);
      }
    }, {
      timezone: "Australia/Sydney"
    });
    this.jobs.set("grace-period-processing", job);
    this.jobRunningStatus.set("grace-period-processing", true);
    console.log("   \u2705 Grace period processing job scheduled (daily at 2 AM)");
  }
  /**
   * Send customer activation reminders twice daily (9 AM and 3 PM)
   * Reminds customers who haven't activated their warranty after installer verification
   */
  startCustomerActivationReminderJob() {
    const job = cron.schedule("0 9,15 * * *", async () => {
      console.log("\u{1F550} Running customer activation reminder processing...");
      try {
        const result = await this.customerActivationReminderService.processActivationReminders();
        console.log(`\u2705 Customer activation reminders: ${result.sent} sent, ${result.skipped} skipped, ${result.failed} failed`);
      } catch (error) {
        console.error("\u274C Error in customer activation reminder job:", error);
      }
    }, {
      timezone: "Australia/Sydney"
    });
    this.jobs.set("customer-activation-reminders", job);
    this.jobRunningStatus.set("customer-activation-reminders", true);
    console.log("   \u2705 Customer activation reminder job scheduled (daily at 9 AM and 3 PM)");
  }
  /**
   * Clean up expired verification tokens daily at 4 AM
   */
  startTokenCleanupJob() {
    const job = cron.schedule("0 4 * * *", async () => {
      console.log("\u{1F550} Running token cleanup...");
      try {
        const deletedCount = await VerificationTokenService.cleanupExpiredTokens();
        console.log(`\u2705 Token cleanup complete: ${deletedCount} expired tokens removed`);
      } catch (error) {
        console.error("\u274C Error in token cleanup job:", error);
      }
    }, {
      timezone: "Australia/Sydney"
    });
    this.jobs.set("token-cleanup", job);
    this.jobRunningStatus.set("token-cleanup", true);
    console.log("   \u2705 Token cleanup job scheduled (daily at 4 AM)");
  }
  /**
   * Daily maintenance tasks at 3 AM
   */
  startDailyMaintenanceJob() {
    const job = cron.schedule("0 3 * * *", async () => {
      console.log("\u{1F550} Running daily maintenance tasks...");
      try {
        const reminderStats = await this.reminderService.getReminderStatistics();
        console.log("\u{1F4CA} Daily System Report:");
        console.log(`   Pending Reminders: ${reminderStats.pending_reminders}`);
        console.log(`   Failed Reminders: ${reminderStats.failed_reminders}`);
        console.log(`   Overdue Reminders: ${reminderStats.overdue_reminders}`);
        if (reminderStats.failed_reminders > 0) {
          console.log(`\u26A0\uFE0F  WARNING: ${reminderStats.failed_reminders} failed reminders need attention`);
        }
        if (reminderStats.overdue_reminders > 10) {
          console.log(`\u26A0\uFE0F  WARNING: ${reminderStats.overdue_reminders} overdue reminders - check email service`);
        }
        console.log("\u2705 Daily maintenance complete");
      } catch (error) {
        console.error("\u274C Error in daily maintenance job:", error);
      }
    }, {
      timezone: "Australia/Sydney"
    });
    this.jobs.set("daily-maintenance", job);
    this.jobRunningStatus.set("daily-maintenance", true);
    console.log("   \u2705 Daily maintenance job scheduled (daily at 3 AM)");
  }
  /**
   * Get status of all cron jobs
   */
  getJobStatus() {
    const jobDescriptions = {
      "reminder-processing": "Processes inspection due reminders (hourly)",
      "grace-period-processing": "Processes warranty grace period expiry (daily at 2 AM)",
      "customer-activation-reminders": "Sends reminders to customers who haven't activated warranty (9 AM & 3 PM)",
      "token-cleanup": "Cleans up expired verification tokens (daily at 4 AM)",
      "daily-maintenance": "Daily system maintenance and reporting (daily at 3 AM)"
    };
    const status = {};
    this.jobs.forEach((_, name) => {
      status[name] = {
        running: this.jobRunningStatus.get(name) || false,
        description: jobDescriptions[name] || "Unknown job"
      };
    });
    return status;
  }
  /**
   * Manually trigger a specific job
   */
  async triggerJob(jobName) {
    console.log(`\u{1F527} Manually triggering job: ${jobName}`);
    switch (jobName) {
      case "reminder-processing": {
        const reminderResult = await this.reminderService.processPendingReminders();
        console.log(`\u2705 Manual reminder processing: ${reminderResult.sent} sent, ${reminderResult.failed} failed`);
        break;
      }
      case "grace-period-processing": {
        const expiredCount = await this.reminderService.processGracePeriodExpiry();
        console.log(`\u2705 Manual grace period processing: ${expiredCount} warranties lapsed`);
        break;
      }
      case "customer-activation-reminders": {
        const activationResult = await this.customerActivationReminderService.processActivationReminders();
        console.log(`\u2705 Manual customer activation reminders: ${activationResult.sent} sent, ${activationResult.skipped} skipped`);
        break;
      }
      case "token-cleanup": {
        const deletedCount = await VerificationTokenService.cleanupExpiredTokens();
        console.log(`\u2705 Manual token cleanup: ${deletedCount} tokens removed`);
        break;
      }
      case "daily-maintenance": {
        await this.reminderService.getReminderStatistics();
        console.log("\u2705 Manual maintenance complete - stats retrieved");
        break;
      }
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }
  /**
   * Get cron job statistics
   */
  getJobStatistics() {
    const totalJobs = this.jobs.size;
    let runningJobs = 0;
    let stoppedJobs = 0;
    const jobNames = [];
    this.jobs.forEach((_, name) => {
      jobNames.push(name);
      if (this.jobRunningStatus.get(name)) {
        runningJobs++;
      } else {
        stoppedJobs++;
      }
    });
    return {
      totalJobs,
      runningJobs,
      stoppedJobs,
      jobNames
    };
  }
}
export const cronService = new CronService();
