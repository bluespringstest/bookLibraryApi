import { Op } from 'sequelize';
import { Reader, Book, Borrowing } from '../models/index.js';
import { BORROWING_STATUS } from '../models/borrowing.js';
import { ApiError } from '../utils/ApiError.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

// Constants
const BORROWING_PERIOD_DAYS = 14; // 2 weeks
const MAX_BOOKS_PER_USER = 5;
const DAILY_FINE_RATE = 0.50; // $0.50 per day
const MAX_RENEWALS = 1;

/**
 * Check out a book
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const checkoutBook = async (req, res) => {
  const transaction = await Book.sequelize.transaction();
  
  try {
    const { bookId } = req.params;
    const { id: userId } = req.user; // Changed from req.user.userId to req.user.id
    
    // Check if user exists and is active
    const user = await Reader.findByPk(userId);
    if (!user || user.status !== 'active') {
      throw new ApiError(400, 'User is not active or does not exist');
    }
    
    // Check if user has reached the maximum number of borrowed books
    const borrowedCount = await Borrowing.count({
      where: {
        userId,
        status: {
          [Op.or]: ['borrowed', 'overdue']
        }
      },
      transaction
    });
    
    if (borrowedCount >= MAX_BOOKS_PER_USER) {
      throw new ApiError(400, `Maximum of ${MAX_BOOKS_PER_USER} books can be borrowed at a time`);
    }
    
    // Check if book exists and is available
    const book = await Book.findByPk(bookId, { transaction });
    if (!book) {
      throw new ApiError(404, 'Book not found');
    }
    
    if (book.availableCopies <= 0) {
      throw new ApiError(400, 'No available copies of this book');
    }
    
    // Check if book is already borrowed by the user and not returned
    const existingBorrowing = await Borrowing.findOne({
      where: {
        userId,
        bookId,
        status: {
          [Op.or]: [BORROWING_STATUS.BORROWED, BORROWING_STATUS.OVERDUE]
        }
      },
      transaction
    });
    
    if (existingBorrowing) {
      throw new ApiError(400, 'You have already borrowed this book');
    }
    
    // Create borrowing record
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + BORROWING_PERIOD_DAYS);
    
    const borrowing = await Borrowing.create({
      bookId,
      userId,
      dueDate,
      status: BORROWING_STATUS.BORROWED,
      renewalCount: 0
    }, { transaction });
    
    // Update book availability
    await book.decrement('availableCopies', { by: 1, transaction });
    
    await transaction.commit();
    
    // Fetch the borrowing record with associated book and user data
    const result = await Borrowing.findByPk(borrowing.id, {
      include: [
        { model: Book, as: 'book' },
        { model: Reader, as: 'user' }
      ]
    });
    
    return successResponse(res, { borrowing: result }, 'Book checked out successfully', 201);
  } catch (error) {
    await transaction.rollback();
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Return a book
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const returnBook = async (req, res) => {
  const transaction = await Book.sequelize.transaction();
  
  try {
    const { borrowingId } = req.params;
    const { condition } = req.body;
    const { userId, role } = req.user;
    
    // Find the borrowing record
    const borrowing = await Borrowing.findOne({
      where: {
        id: borrowingId,
        status: {
          [Op.or]: [BORROWING_STATUS.BORROWED, BORROWING_STATUS.OVERDUE]
        }
      },
      include: [
        { model: Book, as: 'book' },
        { model: Reader, as: 'user' }
      ],
      transaction
    });
    
    if (!borrowing) {
      throw new ApiError(404, 'Borrowing record not found or book already returned');
    }
    
    // Check if the user has permission to return this book
    if (role !== 'librarian' && role !== 'admin' && borrowing.userId !== userId) {
      throw new ApiError(403, 'Not authorized to return this book');
    }
    
    // Update borrowing record
    const now = new Date();
    const isLate = now > new Date(borrowing.dueDate);
    
    await borrowing.update({
      returnedAt: now,
      status: isLate ? BORROWING_STATUS.OVERDUE : BORROWING_STATUS.RETURNED,
      fineAmount: isLate ? borrowing.calculateFine(DAILY_FINE_RATE) : 0,
    }, { transaction });
    
    // Update book available copies
    await Book.increment('availableCopies', {
      where: { id: borrowing.bookId },
      transaction
    });
    
    // If book is damaged or lost, handle accordingly
    if (condition === 'damaged') {
      // Apply damage fee
      await borrowing.update({ 
        fineAmount: borrowing.fineAmount + 10.00, // $10 damage fee
        status: BORROWING_STATUS.RETURNED
      }, { transaction });
    } else if (condition === 'lost') {
      // Mark as lost and charge replacement fee
      await borrowing.update({ 
        status: BORROWING_STATUS.LOST,
        fineAmount: borrowing.book.replacementFee || 30.00, // Default $30 replacement fee
        returnedAt: now
      }, { transaction });
    }
    
    // Commit transaction
    await transaction.commit();
    
    return successResponse(res, { 
      borrowing: {
        id: borrowing.id,
        bookId: borrowing.bookId,
        fineAmount: borrowing.fineAmount,
        status: borrowing.status,
        returnedAt: borrowing.returnedAt
      }
    }, 'Book returned successfully');
  } catch (error) {
    await transaction.rollback();
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Renew a book
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const renewBook = async (req, res) => {
  const transaction = await Book.sequelize.transaction();
  
  try {
    const { borrowingId } = req.params;
    const { userId, role } = req.user;
    
    // Find the borrowing record
    const borrowing = await Borrowing.findOne({
      where: {
        id: borrowingId,
        status: BORROWING_STATUS.BORROWED // Can only renew borrowed books (not overdue)
      },
      include: [
        { model: Book, as: 'book' },
        { model: Reader, as: 'user' }
      ],
      transaction
    });
    
    if (!borrowing) {
      throw new ApiError(404, 'Borrowing record not found or not eligible for renewal');
    }
    
    // Check if the user has permission to renew this book
    if (role !== 'librarian' && role !== 'admin' && borrowing.userId !== userId) {
      throw new ApiError(403, 'Not authorized to renew this book');
    }
    
    // Check if book can be renewed
    if (!borrowing.canRenew(MAX_RENEWALS)) {
      throw new ApiError(400, 'This book cannot be renewed further');
    }
    
    // Check if there are pending reservations for this book
    const hasPendingReservations = await Borrowing.count({
      where: {
        bookId: borrowing.bookId,
        status: BORROWING_STATUS.RESERVED,
        id: { [Op.ne]: borrowingId }
      },
      transaction
    }) > 0;
    
    if (hasPendingReservations) {
      throw new ApiError(400, 'Cannot renew: Book has pending reservations');
    }
    
    // Calculate new due date (extend from current due date, not today)
    const newDueDate = new Date(borrowing.dueDate);
    newDueDate.setDate(newDueDate.getDate() + BORROWING_PERIOD_DAYS);
    
    // Update borrowing record
    await borrowing.update({
      dueDate: newDueDate,
      renewalCount: borrowing.renewalCount + 1
    }, { transaction });
    
    // Commit transaction
    await transaction.commit();
    
    return successResponse(res, { 
      borrowing: {
        id: borrowing.id,
        bookId: borrowing.bookId,
        dueDate: newDueDate,
        renewalCount: borrowing.renewalCount + 1
      }
    }, 'Book renewed successfully');
  } catch (error) {
    await transaction.rollback();
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Get user's borrowed books
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserBorrowings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Check if user exists
    const user = await Reader.findByPk(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Build where clause
    const where = { userId };
    if (status) {
      where.status = status;
    }
    
    // Get paginated results
    const { count, rows: borrowings } = await Borrowing.findAndCountAll({
      where,
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['id', 'title', 'isbn', 'coverImage']
        }
      ],
      order: [['dueDate', 'ASC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    
    return successResponse(res, {
      totalItems: count,
      totalPages,
      currentPage: parseInt(page, 10),
      items: borrowings
    });
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Get overdue books
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getOverdueBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Find all overdue borrowings
    const { count, rows: overdueBooks } = await Borrowing.findAndCountAll({
      where: {
        status: BORROWING_STATUS.OVERDUE,
        returnedAt: null
      },
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['id', 'title', 'isbn']
        },
        {
          model: Reader,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['dueDate', 'ASC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    
    return successResponse(res, {
      totalItems: count,
      totalPages,
      currentPage: parseInt(page, 10),
      items: overdueBooks
    });
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

export { checkoutBook, returnBook, renewBook, getUserBorrowings, getOverdueBooks };
