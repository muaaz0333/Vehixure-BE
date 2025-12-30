import cron from "node-cron";
import { ReminderService } from "./reminder-service.js";
export class CronService {
  reminderService;
  jobs = /* @__PURE__ */ new Map();
  constructor() {
    this.reminderService = new ReminderService();
  }
  /**
   * Start all cron jobs
   */
  startAllJobs() {
    console.log("\u{1F550} Starting ERPS cron jobs...");
    this.startReminderProcessingJob();
    this.startGracePeriodProcessingJob();
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
      console.log(`   Stopped: ${name}`);
    });
    this.jobs.clear();
    console.log("\u2705 All cron jobs stopped");
  }
  /**
   * Process pending reminders every hour
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
      scheduled: false,
      timezone: "Australia/Sydney"
    });
    job.start();
    this.jobs.set("reminder-processing", job);
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
      scheduled: false,
      timezone: "Australia/Sydney"
    });
    job.start();
    this.jobs.set("grace-period-processing", job);
    console.log("   \u2705 Grace period processing job scheduled (daily at 2 AM)");
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
      scheduled: false,
      timezone: "Australia/Sydney"
    });
    job.start();
    this.jobs.set("daily-maintenance", job);
    console.log("   \u2705 Daily maintenance job scheduled (daily at 3 AM)");
  }
  /**
   * Get status of all cron jobs
   */
  getJobStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running
        // Note: node-cron doesn't provide next run time directly
        // This would need to be calculated based on the cron expression
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
      case "reminder-processing":
        const result = await this.reminderService.processPendingReminders();
        console.log(`\u2705 Manual reminder processing: ${result.sent} sent, ${result.failed} failed`);
        break;
      case "grace-period-processing":
        const expiredCount = await this.reminderService.processGracePeriodExpiry();
        console.log(`\u2705 Manual grace period processing: ${expiredCount} warranties lapsed`);
        break;
      case "daily-maintenance":
        const stats = await this.reminderService.getReminderStatistics();
        console.log("\u2705 Manual maintenance complete - stats retrieved");
        break;
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }
  /**
   * Add a custom cron job
   */
  addCustomJob(name, cronExpression, task, timezone = "Australia/Sydney") {
    if (this.jobs.has(name)) {
      throw new Error(`Job ${name} already exists`);
    }
    const job = cron.schedule(cronExpression, task, {
      scheduled: false,
      timezone
    });
    job.start();
    this.jobs.set(name, job);
    console.log(`\u2705 Custom job '${name}' scheduled with expression: ${cronExpression}`);
  }
  /**
   * Remove a custom cron job
   */
  removeCustomJob(name) {
    const job = this.jobs.get(name);
    if (!job) {
      throw new Error(`Job ${name} not found`);
    }
    job.stop();
    this.jobs.delete(name);
    console.log(`\u2705 Custom job '${name}' removed`);
  }
  /**
   * Update job schedule
   */
  updateJobSchedule(name, newCronExpression) {
    const job = this.jobs.get(name);
    if (!job) {
      throw new Error(`Job ${name} not found`);
    }
    job.stop();
    console.log(`\u26A0\uFE0F  Job schedule update requires job recreation: ${name}`);
    console.log(`   Current: running, New: ${newCronExpression}`);
  }
  /**
   * Get cron job statistics
   */
  getJobStatistics() {
    const totalJobs = this.jobs.size;
    let runningJobs = 0;
    let stoppedJobs = 0;
    const jobNames = [];
    this.jobs.forEach((job, name) => {
      jobNames.push(name);
      if (job.running) {
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
