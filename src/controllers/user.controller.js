import User from '../models/User.js';
import { Borrowing, Book } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * Get current user's profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return successResponse(res, { user });
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Update current user's profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProfile = async (req, res) => {
  const transaction = await User.sequelize.transaction();
  
  try {
    const { firstName, lastName, email, phone, address } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId, { transaction });
    
    if (!user) {
      await transaction.rollback();
      throw new ApiError(404, 'User not found');
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        where: { email },
        transaction 
      });
      
      if (existingUser) {
        await transaction.rollback();
        throw new ApiError(400, 'Email is already in use');
      }
    }

    // Update user fields
    const updatedFields = {};
    if (firstName) updatedFields.firstName = firstName;
    if (lastName) updatedFields.lastName = lastName;
    if (email) updatedFields.email = email;
    if (phone) updatedFields.phone = phone;
    if (address) updatedFields.address = address;

    await user.update(updatedFields, { transaction });
    await transaction.commit();

    // Get updated user without sensitive data
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] },
    });

    return successResponse(res, { user: updatedUser }, 'Profile updated successfully');
  } catch (error) {
    await transaction.rollback();
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Change user's password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const changePassword = async (req, res) => {
  const transaction = await User.sequelize.transaction();
  
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      await transaction.rollback();
      throw new ApiError(400, 'Current password and new password are required');
    }

    const user = await User.findByPk(userId, { transaction });
    
    if (!user) {
      await transaction.rollback();
      throw new ApiError(404, 'User not found');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      await transaction.rollback();
      throw new ApiError(401, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save({ transaction });
    await transaction.commit();

    return successResponse(res, null, 'Password updated successfully');
  } catch (error) {
    await transaction.rollback();
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Get current user's borrowing history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBorrowingHistory = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    // Build where clause
    const where = { userId };
    if (status) where.status = status;

    // Get paginated results
    const { count, rows: borrowings } = await Borrowing.findAndCountAll({
      where,
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['id', 'title', 'isbn', 'coverImage'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);

    return successResponse(res, {
      totalItems: count,
      totalPages,
      currentPage: parseInt(page, 10),
      items: borrowings,
    });
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

/**
 * Get current user's reading statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReadingStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total books borrowed
    const totalBorrowed = await Borrowing.count({
      where: { userId },
    });

    // Get currently borrowed books
    const currentlyBorrowed = await Borrowing.count({
      where: { 
        userId,
        status: 'borrowed',
      },
    });

    // Get overdue books
    const overdueBooks = await Borrowing.count({
      where: { 
        userId,
        status: 'overdue',
      },
    });

    // Get favorite genre (simplified example)
    const favoriteGenre = await Borrowing.findOne({
      attributes: [
        [Borrowing.sequelize.fn('COUNT', Borrowing.sequelize.col('book.genreId')), 'count'],
        [Borrowing.sequelize.col('book.genre.name'), 'genreName'],
      ],
      include: [
        {
          model: Book,
          as: 'book',
          attributes: [],
          include: [
            {
              model: Book.sequelize.models.Genre,
              as: 'genre',
              attributes: [],
            },
          ],
        },
      ],
      where: { userId },
      group: ['book.genreId'],
      order: [[Borrowing.sequelize.literal('count'), 'DESC']],
    });

    return successResponse(res, {
      totalBorrowed,
      currentlyBorrowed,
      overdueBooks,
      favoriteGenre: favoriteGenre ? favoriteGenre.get('genreName') : null,
    });
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

export { getProfile, updateProfile, changePassword, getBorrowingHistory, getReadingStats };
