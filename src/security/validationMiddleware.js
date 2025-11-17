/**
 * Input Validation Middleware
 * 
 * Express middleware for validating request payloads using Zod schemas.
 * Wraps validation helpers from src/validation/index.js.
 */

const { validateRegisterService, validateRouteRequest } = require('../validation');

/**
 * Validation middleware for /register endpoint
 * Validates service registration payload
 */
function validateRegisterMiddleware(req, res, next) {
  try {
    const validated = validateRegisterService(req.body);
    // Replace req.body with validated (sanitized) data
    req.body = validated;
    next();
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message,
        details: error.details,
      });
    }
    // Unexpected error
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Validation failed',
    });
  }
}

/**
 * Validation middleware for /route endpoint
 * Validates routing request payload
 */
function validateRouteMiddleware(req, res, next) {
  try {
    const validated = validateRouteRequest(req.body);
    // Replace req.body with validated (sanitized) data
    req.body = validated;
    next();
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message,
        details: error.details,
      });
    }
    // Unexpected error
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Validation failed',
    });
  }
}

module.exports = {
  validateRegisterMiddleware,
  validateRouteMiddleware,
};

