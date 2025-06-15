import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import notificationService from './notification.service.js';
import { Borrowing } from '../models/index.js';
import { Op } from 'sequelize';

class SchedulerService {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * Initialize all scheduled jobs
   */
  init() {
    // Schedule job to check for due soon books (runs every day at 9 AM)
    this.scheduleJob('check-due-soon', '0 9 * * *', this.checkDueSoonBooks.bind(this));
    
    // Schedule job to check for overdue books (runs every day at 10 AM)
    this.scheduleJob('check-overdue', '0 10 * * *', this.checkOverdueBooks.bind(this));
    
    // Schedule job to process scheduled notifications (runs every 15 minutes)
    this.scheduleJob('process-notifications', '*/15 * * * *', this.processScheduledNotifications.bind(this));
    
    // Schedule job to clean up expired notifications (runs once a day at midnight)
    this.scheduleJob('cleanup-notifications', '0 0 * * *', this.cleanupExpiredNotifications.bind(this));
    
    logger.info('Scheduler service initialized');
  }

  /**
   * Schedule a new job
   * @param {string} name - Job name (must be unique)
   * @param {string} schedule - Cron schedule expression
   * @param {Function} task - Function to execute
   */
  scheduleJob(name, schedule, task) {
    if (this.jobs.has(name)) {
      logger.warn(`Job ${name} is already scheduled`);
      return;
    }

    const job = cron.schedule(schedule, async () => {
      logger.info(`Running scheduled job: ${name}`);
      try {
        await task();
        logger.info(`Completed job: ${name}`);
      } catch (error) {
        logger.error(`Error in job ${name}:`, error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC',
    });

    this.jobs.set(name, job);
    logger.info(`Scheduled job: ${name} with schedule ${schedule}`);
  }

  /**
   * Stop a scheduled job
   * @param {string} name - Job name
   */
  stopJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      logger.info(`Stopped job: ${name}`);
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stopAllJobs() {
    for (const [name, job] of this.jobs.entries()) {
      job.stop();
      logger.info(`Stopped job: ${name}`);
    }
    this.jobs.clear();
  }

  /**
   * Check for books that are due soon (within 3 days)
   */
  async checkDueSoonBooks() {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(now.getDate() + 3);

      // Find borrowings that are due in the next 3 days and don't have a due soon notification
      const borrowings = await Borrowing.findAll({
        where: {
          returnDate: null, // Not yet returned
          dueDate: {
            [Op.gt]: now, // Not yet due
            [Op.lte]: threeDaysFromNow, // Due within 3 days
          },
          // Only include borrowings that don't already have a due soon notification
          [Op.and]: [
            {
              '$notifications.type$': { [Op.ne]: 'book_due_soon' },
            },
            {
              '$notifications.metadata.daysBefore$': { [Op.ne]: 3 },
            },
          ],
        },
        include: [
          {
            association: 'notifications',
            required: false,
            where: {
              type: 'book_due_soon',
            },
          },
          'user',
          'book',
        ],
      });

      logger.info(`Found ${borrowings.length} books due soon`);

      // Create due soon notifications
      for (const borrowing of borrowings) {
        try {
          await notificationService.scheduleBookDueNotification(borrowing, 3);
        } catch (error) {
          logger.error(`Error creating due soon notification for borrowing ${borrowing.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error checking for due soon books:', error);
      throw error;
    }
  }

  /**
   * Check for overdue books
   */
  async checkOverdueBooks() {
    try {
      const now = new Date();

      // Find borrowings that are overdue and don't have an overdue notification
      const borrowings = await Borrowing.findAll({
        where: {
          returnDate: null, // Not yet returned
          dueDate: {
            [Op.lt]: now, // Past due date
          },
          // Only include borrowings that don't already have an overdue notification
          [Op.and]: [
            {
              '$notifications.type$': { [Op.ne]: 'book_overdue' },
            },
          ],
        },
        include: [
          {
            association: 'notifications',
            required: false,
            where: {
              type: 'book_overdue',
            },
          },
          'user',
          'book',
        ],
      });

      logger.info(`Found ${borrowings.length} overdue books`);

      // Create overdue notifications
      for (const borrowing of borrowings) {
        try {
          await notificationService.scheduleBookOverdueNotification(borrowing);
        } catch (error) {
          logger.error(`Error creating overdue notification for borrowing ${borrowing.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error checking for overdue books:', error);
      throw error;
    }
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications() {
    try {
      const processed = await notificationService.processScheduledNotifications(100);
      logger.info(`Processed ${processed.length} scheduled notifications`);
    } catch (error) {
      logger.error('Error processing scheduled notifications:', error);
      throw error;
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications() {
    try {
      const deletedCount = await notificationService.cleanupExpiredNotifications(30); // Keep for 30 days
      logger.info(`Cleaned up ${deletedCount} expired notifications`);
    } catch (error) {
      logger.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const schedulerService = new SchedulerService();

export default schedulerService;
