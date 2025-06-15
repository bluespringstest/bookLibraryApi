import express from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validator.middleware.js';
import bookController from '../controllers/book.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Books
 *   description: Book management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Book:
 *       type: object
 *       required:
 *         - isbn
 *         - title
 *         - authorId
 *         - genreId
 *         - totalCopies
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the book
 *         isbn:
 *           type: string
 *           description: The ISBN of the book
 *         title:
 *           type: string
 *           description: The title of the book
 *         description:
 *           type: string
 *           description: A description of the book
 *         publishedDate:
 *           type: string
 *           format: date
 *           description: The publication date of the book
 *         publisher:
 *           type: string
 *           description: The publisher of the book
 *         pageCount:
 *           type: integer
 *           description: The number of pages in the book
 *         language:
 *           type: string
 *           description: The language of the book
 *         coverImage:
 *           type: string
 *           format: uri
 *           description: URL to the book cover image
 *         totalCopies:
 *           type: integer
 *           description: Total number of copies available
 *         availableCopies:
 *           type: integer
 *           description: Number of copies currently available
 *         authorId:
 *           type: integer
 *           description: ID of the book's author
 *         genreId:
 *           type: integer
 *           description: ID of the book's genre
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the book was added
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the book was last updated
 */

// Public routes
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().trim(),
    query('author').optional().isInt().toInt(),
    query('genre').optional().isInt().toInt(),
    query('available').optional().isIn(['true', 'false']),
  ],
  validate,
  bookController.getBooks
);

router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid book ID'),
  ],
  validate,
  bookController.getBookById
);

// Protected routes (require authentication)
router.use(protect);

// Routes that require librarian or admin role
router.use(authorize('librarian', 'admin'));

router.post(
  '/',
  [
    body('isbn').trim().notEmpty().withMessage('ISBN is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('authorId').isInt({ min: 1 }).withMessage('Valid author ID is required'),
    body('genreId').isInt({ min: 1 }).withMessage('Valid genre ID is required'),
    body('totalCopies').optional().isInt({ min: 1 }).withMessage('Total copies must be at least 1'),
    body('description').optional().trim(),
    body('publishedDate').optional().isISO8601().toDate(),
    body('publisher').optional().trim(),
    body('pageCount').optional().isInt({ min: 1 }),
    body('language').optional().trim(),
    body('coverImage').optional().trim().isURL().withMessage('Cover image must be a valid URL'),
  ],
  validate,
  bookController.createBook
);

router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid book ID'),
    body('isbn').optional().trim().notEmpty(),
    body('title').optional().trim().notEmpty(),
    body('authorId').optional().isInt({ min: 1 }),
    body('genreId').optional().isInt({ min: 1 }),
    body('totalCopies').optional().isInt({ min: 1 }),
    body('description').optional().trim(),
    body('publishedDate').optional().isISO8601().toDate(),
    body('publisher').optional().trim(),
    body('pageCount').optional().isInt({ min: 1 }),
    body('language').optional().trim(),
    body('coverImage').optional().trim().isURL(),
  ],
  validate,
  bookController.updateBook
);

router.delete(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid book ID'),
  ],
  validate,
  bookController.deleteBook
);

router.post(
  '/scan',
  [
    body('isbn').trim().notEmpty().withMessage('ISBN is required'),
  ],
  validate,
  bookController.scanBook
);

module.exports = router;
