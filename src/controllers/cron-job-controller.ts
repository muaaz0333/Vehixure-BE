import { FastifyRequest, FastifyReply } from 'fastify';
import { cronService } from '../services/cron-service.js';
import { ReminderService } from '../services/reminder-service.js';

export class CronJobController {
  private reminderService: ReminderService;

  constructor() {
    this.reminderService = new ReminderService();
  }

  /**
   * Get cron job status
   */
  async getCronJobStatus(
    request: FastifyRequest, 
    reply: FastifyReply
  ) {
    try {
      const status = cronService.getJobStatus();
      const statistics = cronService.getJobStatistics();
      const reminderStats = await this.reminderService.getReminderStatistics();

      return reply.status(200).send({
        success: true,
        data: {
          cronJobs: status,
          jobStatistics: statistics,
          reminderStatistics: reminderStats
        }
      });
    } catch (error) {
      request.log.error('Error getting cron job status:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get cron job status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Start all cron jobs
   */
  async startCronJobs(
    request: FastifyRequest, 
    reply: FastifyReply
  ) {
    try {
      cronService.startAllJobs();

      return reply.status(200).send({
        success: true,
        message: 'All cron jobs started successfully'
      });
    } catch (error) {
      request.log.error('Error starting cron jobs:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to start cron jobs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Stop all cron jobs
   */
  async stopCronJobs(
    request: FastifyRequest, 
    reply: FastifyReply
  ) {
    try {
      cronService.stopAllJobs();

      return reply.status(200).send({
        success: true,
        message: 'All cron jobs stopped successfully'
      });
    } catch (error) {
      request.log.error('Error stopping cron jobs:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to stop cron jobs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Manually trigger reminder processing
   */
  async triggerReminderProcessing(
    request: FastifyRequest, 
    reply: FastifyReply
  ) {
    try {
      await cronService.triggerJob('reminder-processing');

      return reply.status(200).send({
        success: true,
        message: 'Reminder processing triggered successfully'
      });
    } catch (error) {
      request.log.error('Error triggering reminder processing:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to trigger reminder processing',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Manually trigger grace period processing
   */
  async triggerGracePeriodProcessing(
    request: FastifyRequest, 
    reply: FastifyReply
  ) {
    try {
      await cronService.triggerJob('grace-period-processing');

      return reply.status(200).send({
        success: true,
        message: 'Grace period processing triggered successfully'
      });
    } catch (error) {
      request.log.error('Error triggering grace period processing:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to trigger grace period processing',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Manually trigger customer activation reminders
   */
  async triggerCustomerActivationReminders(
    request: FastifyRequest, 
    reply: FastifyReply
  ) {
    try {
      await cronService.triggerJob('customer-activation-reminders');

      return reply.status(200).send({
        success: true,
        message: 'Customer activation reminders triggered successfully'
      });
    } catch (error) {
      request.log.error('Error triggering customer activation reminders:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to trigger customer activation reminders',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get reminder statistics
   */
  async getReminderStatistics(
    request: FastifyRequest, 
    reply: FastifyReply
  ) {
    try {
      const statistics = await this.reminderService.getReminderStatistics();

      return reply.status(200).send({
        success: true,
        data: statistics
      });
    } catch (error) {
      request.log.error('Error getting reminder statistics:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to get reminder statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
