import express from 'express';
import { query, param, body } from 'express-validator';
import { validate } from '../middleware/validator.middleware.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats,
  processScheduledNotifications,
  cleanupExpiredNotifications
} from '../controllers/notification.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notifications and alerts
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [book_due_soon, book_overdue, book_available, reservation_ready, account_activity, system_announcement]
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         isRead:
 *           type: boolean
 *         emailSent:
 *           type: boolean
 *         metadata:
 *           type: object
 *           additionalProperties: true
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     NotificationStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total number of notifications
 *         unread:
 *           type: integer
 *           description: Number of unread notifications
 *         recent:
 *           type: integer
 *           description: Number of notifications from the last 7 days
 * 
 *     PaginatedNotifications:
 *       type: object
 *       properties:
 *         totalItems:
 *           type: integer
 *         totalPages:
 *           type: integer
 *         currentPage:
 *           type: integer
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Notification'
 */

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: unread
 *         schema:
 *           type: boolean
 *         description: Filter by unread status
 *     responses:
 *       200:
 *         description: List of user notifications
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedNotifications'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  validate([
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('unread').optional().isBoolean().toBoolean(),
  ]),
  getNotifications
);

/**
 * @swagger
 * /api/v1/notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/NotificationStats'
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', getNotificationStats);

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   post:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully marked all notifications as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: integer
 *                 message:
 *                   type: string
 *                   example: "Marked 5 notifications as read"
 *       401:
 *         description: Unauthorized
 */
router.post('/read-all', markAllAsRead);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     notification:
 *                       $ref: '#/components/schemas/Notification'
 *                 message:
 *                   type: string
 *                   example: "Notification marked as read"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found or access denied
 */
router.patch(
  '/:id/read',
  [param('id').isUUID().withMessage('Invalid notification ID')],
  validate,
  markAsRead
);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Notification deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found or access denied
 */
router.delete(
  '/:id',
  protect,
  validate([param('id').isUUID().withMessage('Invalid notification ID')]),
  deleteNotification
);

// Admin-only routes
router.use(authorize('admin'));

/**
 * @swagger
 * /api/v1/notifications/process-scheduled:
 *   post:
 *     summary: Process scheduled notifications (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of notifications to process
 *     responses:
 *       200:
 *         description: Successfully processed scheduled notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     processed:
 *                       type: integer
 *                 message:
 *                   type: string
 *                   example: "Processed 3 scheduled notifications"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post(
  '/process-scheduled',
  [query('limit').optional().isInt({ min: 1, max: 1000 }).toInt()],
  validate,
  processScheduledNotifications
);

/**
 * @swagger
 * /api/v1/notifications/cleanup-expired:
 *   post:
 *     summary: Clean up expired notifications (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daysToKeep:
 *                 type: integer
 *                 default: 30
 *                 description: Number of days to keep expired notifications
 *     responses:
 *       200:
 *         description: Successfully cleaned up expired notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 *                 message:
 *                   type: string
 *                   example: "Cleaned up 15 expired notifications"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post(
  '/cleanup-expired',
  [
    body('daysToKeep')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days to keep must be between 1 and 365')
      .toInt(),
  ],
  validate,
  cleanupExpiredNotifications
);

export default router;
