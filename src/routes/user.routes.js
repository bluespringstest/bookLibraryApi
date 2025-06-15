import express from 'express';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validator.middleware.js';
import { getProfile, updateProfile, changePassword, getBorrowingHistory, getReadingStats } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User profile and account management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         role:
 *           type: string
 *           enum: [member, librarian, admin]
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     UpdateProfile:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         address:
 *           type: string
 * 
 *     ChangePassword:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           minLength: 6
 *         newPassword:
 *           type: string
 *           minLength: 6
 * 
 *     BorrowingHistory:
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
 *             $ref: '#/components/schemas/Borrowing'
 * 
 *     ReadingStats:
 *       type: object
 *       properties:
 *         totalBorrowed:
 *           type: integer
 *         currentlyBorrowed:
 *           type: integer
 *         overdueBooks:
 *           type: integer
 *         favoriteGenre:
 *           type: string
 *           nullable: true
 */

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /api/v1/users/me:
 *   put:
 *     summary: Update current user's profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfile'
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/UserProfile'
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *       400:
 *         description: Invalid input or email already in use
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/me',
  [
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
    body('email').optional().trim().isEmail(),
    body('phone').optional().trim().isLength({ min: 5, max: 20 }),
    body('address').optional().trim().isLength({ max: 255 }),
  ],
  validate,
  updateProfile
);

/**
 * @swagger
 * /api/v1/users/change-password:
 *   post:
 *     summary: Change user's password
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePassword'
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                   example: Password updated successfully
 *       400:
 *         description: Current password and new password are required
 *       401:
 *         description: Unauthorized or current password is incorrect
 */
router.post(
  '/change-password',
  [
    body('currentPassword').isString().isLength({ min: 6 }),
    body('newPassword').isString().isLength({ min: 6 }),
  ],
  validate,
  changePassword
);

/**
 * @swagger
 * /api/v1/users/borrowing-history:
 *   get:
 *     summary: Get current user's borrowing history
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [borrowed, returned, overdue, lost]
 *         description: Filter by borrowing status
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
 *     responses:
 *       200:
 *         description: Borrowing history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/BorrowingHistory'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/borrowings',
  [
    query('status').optional().isIn(['borrowed', 'returned', 'overdue', 'lost']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  getBorrowingHistory
);

/**
 * @swagger
 * /api/v1/users/reading-stats:
 *   get:
 *     summary: Get current user's reading statistics
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reading statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ReadingStats'
 *       401:
 *         description: Unauthorized
 */
router.get('/reading-stats', getReadingStats);

export default router;
