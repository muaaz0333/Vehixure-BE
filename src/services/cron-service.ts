import cron from 'node-cron';
import { ReminderService } from './reminder-service.js';

export class CronService {
  private reminderService: ReminderService;
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.reminderService = new ReminderService();
  }

  /**
   * Start all cron jobs
   */
  startAllJobs(): void {
    console.log('🕐 Starting ERPS cron jobs...');
    
    this.startReminderProcessingJob();
    this.startGracePeriodProcessingJob();
    this.startDailyMaintenanceJob();
    
    console.log('✅ All cron jobs started successfully');
  }

  /**
   * Stop all cron jobs
   */
  stopAllJobs(): void {
    console.log('🛑 Stopping all cron jobs...');
    
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`   Stopped: ${name}`);
    });
    
    this.jobs.clear();
    console.log('✅ All cron jobs stopped');
  }

  /**
   * Process pending reminders every hour
   */
  private startReminderProcessingJob(): void {
    const job = cron.schedule('0 * * * *', async () => {
      console.log('🕐 Running hourly reminder processing...');
      
      try {
        const result = await this.reminderService.processPendingReminders();
        console.log(`✅ Reminder processing complete: ${result.sent} sent, ${result.failed} failed`);
      } catch (error) {
        console.error('❌ Error in reminder processing job:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Australia/Sydney'
    });
    
    job.start();
    this.jobs.set('reminder-processing', job);
    console.log('   ✅ Reminder processing job scheduled (hourly)');
  }

  /**
   * Process grace period expiry daily at 2 AM
   */
  private startGracePeriodProcessingJob(): void {
    const job = cron.schedule('0 2 * * *', async () => {
      console.log('🕐 Running daily grace period processing...');
      
      try {
        const expiredCount = await this.reminderService.processGracePeriodExpiry();
        console.log(`✅ Grace period processing complete: ${expiredCount} warranties lapsed`);
      } catch (error) {
        console.error('❌ Error in grace period processing job:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Australia/Sydney'
    });
    
    job.start();
    this.jobs.set('grace-period-processing', job);
    console.log('   ✅ Grace period processing job scheduled (daily at 2 AM)');
  }

  /**
   * Daily maintenance tasks at 3 AM
   */
  private startDailyMaintenanceJob(): void {
    const job = cron.schedule('0 3 * * *', async () => {
      console.log('🕐 Running daily maintenance tasks...');
      
      try {
        // Get system statistics
        const reminderStats = await this.reminderService.getReminderStatistics();
        
        console.log('📊 Daily System Report:');
        console.log(`   Pending Reminders: ${reminderStats.pending_reminders}`);
        console.log(`   Failed Reminders: ${reminderStats.failed_reminders}`);
        console.log(`   Overdue Reminders: ${reminderStats.overdue_reminders}`);
        
        // Log any issues that need attention
        if (reminderStats.failed_reminders > 0) {
          console.log(`⚠️  WARNING: ${reminderStats.failed_reminders} failed reminders need attention`);
        }
        
        if (reminderStats.overdue_reminders > 10) {
          console.log(`⚠️  WARNING: ${reminderStats.overdue_reminders} overdue reminders - check email service`);
        }
        
        console.log('✅ Daily maintenance complete');
        
      } catch (error) {
        console.error('❌ Error in daily maintenance job:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Australia/Sydney'
    });
    
    job.start();
    this.jobs.set('daily-maintenance', job);
    console.log('   ✅ Daily maintenance job scheduled (daily at 3 AM)');
  }

  /**
   * Get status of all cron jobs
   */
  getJobStatus(): { [jobName: string]: { running: boolean; nextRun?: Date } } {
    const status: { [jobName: string]: { running: boolean; nextRun?: Date } } = {};
    
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running,
        // Note: node-cron doesn't provide next run time directly
        // This would need to be calculated based on the cron expression
      };
    });
    
    return status;
  }

  /**
   * Manually trigger a specific job
   */
  async triggerJob(jobName: string): Promise<void> {
    console.log(`🔧 Manually triggering job: ${jobName}`);
    
    switch (jobName) {
      case 'reminder-processing':
        const result = await this.reminderService.processPendingReminders();
        console.log(`✅ Manual reminder processing: ${result.sent} sent, ${result.failed} failed`);
        break;
        
      case 'grace-period-processing':
        const expiredCount = await this.reminderService.processGracePeriodExpiry();
        console.log(`✅ Manual grace period processing: ${expiredCount} warranties lapsed`);
        break;
        
      case 'daily-maintenance':
        const stats = await this.reminderService.getReminderStatistics();
        console.log('✅ Manual maintenance complete - stats retrieved');
        break;
        
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }

  /**
   * Add a custom cron job
   */
  addCustomJob(
    name: string, 
    cronExpression: string, 
    task: () => Promise<void>,
    timezone: string = 'Australia/Sydney'
  ): void {
    if (this.jobs.has(name)) {
      throw new Error(`Job ${name} already exists`);
    }
    
    const job = cron.schedule(cronExpression, task, {
      scheduled: false,
      timezone
    });
    
    job.start();
    this.jobs.set(name, job);
    
    console.log(`✅ Custom job '${name}' scheduled with expression: ${cronExpression}`);
  }

  /**
   * Remove a custom cron job
   */
  removeCustomJob(name: string): void {
    const job = this.jobs.get(name);
    if (!job) {
      throw new Error(`Job ${name} not found`);
    }
    
    job.stop();
    this.jobs.delete(name);
    
    console.log(`✅ Custom job '${name}' removed`);
  }

  /**
   * Update job schedule
   */
  updateJobSchedule(name: string, newCronExpression: string): void {
    const job = this.jobs.get(name);
    if (!job) {
      throw new Error(`Job ${name} not found`);
    }
    
    // Stop the existing job
    job.stop();
    
    // Note: node-cron doesn't support updating schedule directly
    // You would need to recreate the job with the new schedule
    console.log(`⚠️  Job schedule update requires job recreation: ${name}`);
    console.log(`   Current: running, New: ${newCronExpression}`);
  }

  /**
   * Get cron job statistics
   */
  getJobStatistics(): {
    totalJobs: number;
    runningJobs: number;
    stoppedJobs: number;
    jobNames: string[];
  } {
    const totalJobs = this.jobs.size;
    let runningJobs = 0;
    let stoppedJobs = 0;
    const jobNames: string[] = [];
    
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

// Export singleton instance
export const cronService = new CronService();