import { ApiError } from '../utils/ApiError.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import notificationService from '../services/notification.service.js';

/**
 * Get user notifications
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, unread } = req.query;
    const userId = req.user.id;

    const notifications = await notificationService.getUserNotifications(userId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      unreadOnly: unread === 'true',
    });

    return successResponse(res, notifications);
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Mark a notification as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await notificationService.markAsRead(id, userId);
    return successResponse(res, { notification }, 'Notification marked as read');
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Mark all notifications as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const updatedCount = await notificationService.markAllAsRead(userId);
    
    return successResponse(
      res, 
      { updatedCount }, 
      `Marked ${updatedCount} notifications as read`
    );
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Delete a notification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await notificationService.deleteNotification(id, userId);
    return successResponse(res, null, 'Notification deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Get notification statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get total notifications
    const total = await req.db.Notification.count({
      where: { userId },
    });

    // Get unread notifications count
    const unread = await req.db.Notification.count({
      where: { 
        userId,
        isRead: false,
      },
    });

    // Get recent notifications (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recent = await req.db.Notification.count({
      where: {
        userId,
        createdAt: {
          [req.db.Sequelize.Op.gte]: weekAgo,
        },
      },
    });

    return successResponse(res, {
      total,
      unread,
      recent,
    });
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Process scheduled notifications (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const processScheduledNotifications = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Forbidden: Admin access required');
    }

    const { limit = 100 } = req.query;
    const processed = await notificationService.processScheduledNotifications(parseInt(limit, 10));
    
    return successResponse(
      res, 
      { processed: processed.length },
      `Processed ${processed.length} scheduled notifications`
    );
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Clean up expired notifications (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const cleanupExpiredNotifications = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Forbidden: Admin access required');
    }

    const { daysToKeep = 30 } = req.body;
    const deletedCount = await notificationService.cleanupExpiredNotifications(parseInt(daysToKeep, 10));
    
    return successResponse(
      res,
      { deletedCount },
      `Cleaned up ${deletedCount} expired notifications`
    );
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

export {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats,
  processScheduledNotifications,
  cleanupExpiredNotifications,
};
