const { Op } = require('sequelize');
const { Notification, User, Book } = require('../models');
const logger = require('../utils/logger');
const emailService = require('./email.service');
const notificationTemplates = require('../utils/notificationTemplates');

class NotificationService {
  /**
   * Create a new notification
   * @param {Object} options - Notification options
   * @param {string} options.type - Notification type
   * @param {Object} options.user - User object or user ID
   * @param {Object} [options.book] - Book object or book ID (if applicable)
   * @param {Object} [options.metadata] - Additional metadata
   * @param {Date} [options.scheduledAt] - When to send the notification (optional)
   * @param {Date} [options.expiresAt] - When the notification expires (optional)
   * @returns {Promise<Object>} Created notification
   */
  async createNotification({
    type,
    user,
    book = null,
    metadata = {},
    scheduledAt = null,
    expiresAt = null,
  }) {
    const transaction = await Notification.sequelize.transaction();

    try {
      // Get user and book instances if IDs are provided
      const userInstance = typeof user === 'object' 
        ? user 
        : await User.findByPk(user, { transaction });

      if (!userInstance) {
        throw new Error('User not found');
      }

      let bookInstance = null;
      if (book) {
        bookInstance = typeof book === 'object' 
          ? book 
          : await Book.findByPk(book, { transaction });
        if (!bookInstance) {
          throw new Error('Book not found');
        }
      }

      // Create notification data
      const notificationData = {
        type,
        userId: userInstance.id,
        title: metadata.title || `New ${type} notification`,
        message: metadata.message || '',
        metadata: JSON.stringify(metadata),
        scheduledAt,
        expiresAt,
        isRead: false,
        emailSent: false,
        ...(bookInstance && { bookId: bookInstance.id }),
      };

      // Create the notification in the database
      const notification = await Notification.create(notificationData, { transaction });
      
      // Send email if not scheduled for later
      if (!scheduledAt || scheduledAt <= new Date()) {
        await this.sendNotification(notification, userInstance, bookInstance);
      }

      await transaction.commit();
      return notification;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send a notification (email and in-app)
   * @param {Object} notification - Notification instance
   * @param {Object} user - User instance
   * @param {Object} [book] - Book instance (optional)
   * @returns {Promise<Object>} Send result
   */
  async sendNotification(notification, user, book = null) {
    // If email notification is requested and user has email
    if (user.email) {
      try {
        const { subject, html } = notificationTemplates.getTemplate(notification.type);
        await emailService.sendEmail({
          to: user.email,
          subject: typeof subject === 'function' 
            ? subject(notification, user, book) 
            : subject,
          html: typeof html === 'function' 
            ? html(notification, user, book) 
            : html,
        });

        // Update notification to mark email as sent
        await notification.update({ emailSent: true });
        return { success: true, notification };
      } catch (error) {
        logger.error('Error sending notification email:', error);
        // Don't fail the whole operation if email fails
        return { success: false, error };
      }
    }

    return { success: true, notification };
  }

  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Updated notification
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found or access denied');
    }

    return notification.update({ isRead: true });
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of updated notifications
   */
  async markAllAsRead(userId) {
    const [updatedCount] = await Notification.update(
      { isRead: true },
      {
        where: {
          userId,
          isRead: false,
        },
      }
    );

    return updatedCount;
  }

  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=10] - Items per page
   * @param {boolean} [options.unreadOnly=false] - Only return unread notifications
   * @returns {Promise<Object>} Paginated notifications
   */
  async getUserNotifications(userId, { page = 1, limit = 10, unreadOnly = false } = {}) {
    const offset = (page - 1) * limit;
    
    const where = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      items: rows,
    };
  }

  /**
   * Get unread notifications for a user
   * @param {string} userId - User ID
   * @param {number} [limit=50] - Maximum number of notifications to return
   * @returns {Promise<Array>} Unread notifications
   */
  async getUnreadNotifications(userId, limit = 50) {
    return Notification.findAll({
      where: {
        userId,
        isRead: false,
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
    });
  }

  /**
   * Process scheduled notifications that are due
   * @param {number} [limit=100] - Maximum number of notifications to process
   * @returns {Promise<Object>} Processing result
   */
  async processScheduledNotifications(limit = 100) {
    const now = new Date();
    const notifications = await Notification.findAll({
      where: {
        scheduledAt: {
          [Op.lte]: now,
        },
        emailSent: false,
      },
      limit,
      order: [['scheduledAt', 'ASC']],
      include: [
        {
          model: User,
          as: 'user',
          required: true,
        },
      ],
    });

    const results = {
      total: notifications.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    // Process notifications in parallel
    await Promise.all(notifications.map(async (notification) => {
      try {
        await this.sendNotification(notification, notification.user);
        results.success += 1;
      } catch (error) {
        results.failed += 1;
        results.errors.push({
          notificationId: notification.id,
          error: error.message,
        });
      }
    }));

    return results;
  }

  /**
   * Clean up expired notifications
   * @param {number} [daysToKeep=30] - Number of days to keep expired notifications
   * @returns {Promise<number>} Number of deleted notifications
   */
  async cleanupExpiredNotifications(daysToKeep = 30) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - daysToKeep);

    const result = await Notification.destroy({
      where: {
        expiresAt: {
          [Op.lt]: new Date(),
        },
        createdAt: {
          [Op.lt]: expirationDate,
        },
      },
    });

    return result;
  }

  /**
   * Schedule a book due soon notification
   * @param {Object} borrowing - Borrowing instance
   * @param {number} [daysBefore=3] - Number of days before due date to send notification
   * @returns {Promise<Object>} Created notification
   */
  async scheduleBookDueNotification(borrowing, daysBefore = 3) {
    const dueDate = new Date(borrowing.dueDate);
    const scheduledAt = new Date(dueDate);
    scheduledAt.setDate(dueDate.getDate() - daysBefore);

    return this.createNotification({
      type: 'book_due_soon',
      user: borrowing.userId,
      book: borrowing.bookId,
      metadata: {
        title: 'Book Due Soon',
        message: `The book is due on ${dueDate.toLocaleDateString()}.`,
        dueDate: dueDate.toISOString(),
      },
      scheduledAt,
      expiresAt: dueDate,
    });
  }

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<number>} Number of deleted notifications (0 or 1)
   */
  async deleteNotification(notificationId, userId) {
    const result = await Notification.destroy({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (result === 0) {
      throw new Error('Notification not found or access denied');
    }

    return result;
  }
}

// Create a singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;
