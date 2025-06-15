import config from '../config/config.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns {void}
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    statusCode: err.statusCode || 500,
    path: req.originalUrl,
    method: req.method,
    ...(config.env === 'development' && { 
      stack: err.stack,
      error: err 
    }),
  });

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    err = new ApiError(401, 'Invalid token');
  }
  
  // Handle JWT expired error
  if (err.name === 'TokenExpiredError') {
    err = new ApiError(401, 'Token expired');
  }

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      type: e.type,
      value: e.value,
    }));
    err = ApiError.badRequest('Validation error', errors);
  }

  // Handle multer file upload errors
  if (err.name === 'MulterError') {
    err = new ApiError(400, `File upload error: ${err.message}`);
  }

  // Handle other operational errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const isOperational = err.isOperational !== false;
  const errors = err.errors || [];

  // In production, don't leak error details
  const isProduction = config.env === 'production';
  const response = {
    success: false,
    status: statusCode,
    message: isProduction && !isOperational ? 'Something went wrong' : message,
    ...(errors.length > 0 && { errors }),
    ...(config.env === 'development' && {
      stack: isProduction ? undefined : err.stack,
      ...(isProduction ? {} : { error: err })
    }),
  };

  // Send the error response
  res.status(statusCode).json(response);
};

/**
 * 404 Not Found middleware
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns {void}
 */
export const notFound = (req, res, next) => {
  next(ApiError.notFound(`The requested resource ${req.originalUrl} was not found`));
};

/**
 * Async handler to wrap async/await route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};
