import express from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validator.middleware.js';
import * as borrowingController from '../controllers/borrowing.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Borrowing
 *   description: Book borrowing and returning operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Borrowing:
 *       type: object
 *       required:
 *         - bookId
 *         - userId
 *         - dueDate
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the borrowing record
 *         bookId:
 *           type: string
 *           format: uuid
 *           description: The ID of the borrowed book
 *         userId:
 *           type: string
 *           format: uuid
 *           description: The ID of the user who borrowed the book
 *         borrowedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the book was borrowed
 *         dueDate:
 *           type: string
 *           format: date
 *           description: The due date for returning the book
 *         returnedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the book was returned
 *         status:
 *           type: string
 *           enum: [borrowed, returned, overdue, lost]
 *           description: The status of the borrowing
 *         renewalCount:
 *           type: integer
 *           description: Number of times the book has been renewed
 *         fineAmount:
 *           type: number
 *           format: float
 *           description: Amount of fine for late return or damage
 *         finePaid:
 *           type: boolean
 *           description: Whether the fine has been paid
 */

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * /api/v1/borrowings/checkout/{bookId}:
 *   post:
 *     summary: Check out a book
 *     tags: [Borrowing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the book to check out
 *     responses:
 *       201:
 *         description: Book checked out successfully
 *       400:
 *         description: Invalid input or book not available
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Book not found
 */
router.post(
  '/checkout/:bookId',
  [
    param('bookId').isUUID().withMessage('Invalid book ID'),
  ],
  validate,
  borrowingController.checkoutBook
);

/**
 * @swagger
 * /api/v1/borrowings/return/{borrowingId}:
 *   post:
 *     summary: Return a book
 *     tags: [Borrowing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: borrowingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the borrowing record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               condition:
 *                 type: string
 *                 enum: [good, damaged, lost]
 *                 description: Condition of the returned book
 *     responses:
 *       200:
 *         description: Book returned successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not authorized to return this book
 *       404:
 *         description: Borrowing record not found
 */
router.post(
  '/return/:borrowingId',
  [
    param('borrowingId').isUUID().withMessage('Invalid borrowing ID'),
    body('condition')
      .optional()
      .isIn(['good', 'damaged', 'lost'])
      .withMessage('Invalid book condition'),
  ],
  validate,
  borrowingController.returnBook
);

/**
 * @swagger
 * /api/v1/borrowings/renew/{borrowingId}:
 *   post:
 *     summary: Renew a borrowed book
 *     tags: [Borrowing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: borrowingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the borrowing record to renew
 *     responses:
 *       200:
 *         description: Book renewed successfully
 *       400:
 *         description: Cannot renew book
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not authorized to renew this book
 *       404:
 *         description: Borrowing record not found
 */
router.post(
  '/renew/:borrowingId',
  [
    param('borrowingId').isUUID().withMessage('Invalid borrowing ID'),
  ],
  validate,
  borrowingController.renewBook
);

/**
 * @swagger
 * /api/v1/borrowings/user/{userId}:
 *   get:
 *     summary: Get user's borrowed books
 *     tags: [Borrowing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the user
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [borrowed, returned, overdue, lost]
 *         description: Filter by status
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
 *         description: List of user's borrowed books
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not authorized to view these records
 *       404:
 *         description: User not found
 */
router.get(
  '/user/:userId',
  [
    param('userId').isUUID().withMessage('Invalid user ID'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(['borrowed', 'returned', 'overdue', 'lost']),
  ],
  validate,
  borrowingController.getUserBorrowings
);

/**
 * @swagger
 * /api/v1/borrowings/overdue:
 *   get:
 *     summary: Get all overdue books (admin/librarian only)
 *     tags: [Borrowing]
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
 *     responses:
 *       200:
 *         description: List of overdue books
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin/librarian access required
 */
router.get(
  '/overdue',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  authorize('librarian', 'admin'),
  borrowingController.getOverdueBooks
);

export default router;
