import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import config from '../config/config.js';
import User from '../models/User.js';

/**
 * Protect routes - require authentication
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Set token from Bearer token in header
      token = req.headers.authorization.split(' ')[1];
    } 
    // Get token from cookie if not in header
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Check if token exists
    if (!token) {
      throw new ApiError(401, 'Not authorized to access this route');
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);

      // Get user from the token
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        throw new ApiError(401, 'Not authorized, user not found');
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      throw new ApiError(401, 'Not authorized, token failed');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `User role ${req.user.role} is not authorized to access this route`
        )
      );
    }
    next();
  };
};

export { protect, authorize };
