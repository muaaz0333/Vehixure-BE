import { CronJobService } from "../services/cron-job-service.js";
export class CronJobController {
  cronJobService;
  constructor() {
    this.cronJobService = new CronJobService();
  }
  /**
   * Get cron job status
   */
  async getCronJobStatus(request, reply) {
    try {
      const status = this.cronJobService.getCronJobStatus();
      const statistics = await this.cronJobService.getReminderStatistics();
      return reply.status(200).send({
        success: true,
        data: {
          cronJobs: status,
          reminderStatistics: statistics
        }
      });
    } catch (error) {
      request.log.error("Error getting cron job status:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get cron job status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Start all cron jobs
   */
  async startCronJobs(request, reply) {
    try {
      await this.cronJobService.startAllCronJobs();
      return reply.status(200).send({
        success: true,
        message: "All cron jobs started successfully"
      });
    } catch (error) {
      request.log.error("Error starting cron jobs:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to start cron jobs",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Stop all cron jobs
   */
  async stopCronJobs(request, reply) {
    try {
      this.cronJobService.stopAllCronJobs();
      return reply.status(200).send({
        success: true,
        message: "All cron jobs stopped successfully"
      });
    } catch (error) {
      request.log.error("Error stopping cron jobs:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to stop cron jobs",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Manually trigger reminder processing
   */
  async triggerReminderProcessing(request, reply) {
    try {
      const result = await this.cronJobService.triggerReminderProcessing();
      return reply.status(200).send({
        success: true,
        data: result,
        message: `Reminder processing completed: ${result.sent} sent, ${result.failed} failed`
      });
    } catch (error) {
      request.log.error("Error triggering reminder processing:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to trigger reminder processing",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Manually trigger grace period processing
   */
  async triggerGracePeriodProcessing(request, reply) {
    try {
      const expiredCount = await this.cronJobService.triggerGracePeriodProcessing();
      return reply.status(200).send({
        success: true,
        data: { expiredCount },
        message: `Grace period processing completed: ${expiredCount} warranties lapsed`
      });
    } catch (error) {
      request.log.error("Error triggering grace period processing:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to trigger grace period processing",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Get reminder statistics
   */
  async getReminderStatistics(request, reply) {
    try {
      const statistics = await this.cronJobService.getReminderStatistics();
      return reply.status(200).send({
        success: true,
        data: statistics
      });
    } catch (error) {
      request.log.error("Error getting reminder statistics:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get reminder statistics",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}
