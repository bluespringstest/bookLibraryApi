import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

/**
 * Middleware to validate request using express-validator
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns {void}
 * @throws {ApiError} Throws an error if validation fails
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  // Format errors to return in response
  const extractedErrors = [];
  errors.array().forEach((err) => {
    extractedErrors.push({
      field: err.param,
      message: err.msg,
      value: err.value,
      location: err.location,
    });
  });

  next(ApiError.badRequest('Validation failed', extractedErrors));
};

export { validate };
