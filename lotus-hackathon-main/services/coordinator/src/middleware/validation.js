const logger = require('../utils/logger');

/**
 * Validation middleware for request data
 */

/**
 * Validate service registration request
 */
const validateRegistration = (req, res, next) => {
  const { serviceName, version, endpoint, healthCheck, migrationFile } = req.body;

  const errors = [];

  // Validate serviceName
  if (!serviceName || typeof serviceName !== 'string' || serviceName.trim().length === 0) {
    errors.push('serviceName is required and must be a non-empty string');
  }

  // Validate version
  if (!version || typeof version !== 'string' || version.trim().length === 0) {
    errors.push('version is required and must be a non-empty string');
  }

  // Validate endpoint
  if (!endpoint || typeof endpoint !== 'string' || endpoint.trim().length === 0) {
    errors.push('endpoint is required and must be a non-empty string');
  } else {
    // Validate URL format
    try {
      new URL(endpoint);
    } catch (error) {
      errors.push('endpoint must be a valid URL');
    }
  }

  // healthCheck is optional, but if provided, should be a string
  if (healthCheck !== undefined && typeof healthCheck !== 'string') {
    errors.push('healthCheck must be a string if provided');
  }

  // migrationFile is optional, but if provided, should be an object or string
  if (migrationFile !== undefined && typeof migrationFile !== 'object' && typeof migrationFile !== 'string') {
    errors.push('migrationFile must be an object or string if provided');
  }

  if (errors.length > 0) {
    logger.warn('Validation failed for registration request', { errors, body: req.body });
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate UI/UX configuration request
 */
const validateUIUXConfig = (req, res, next) => {
  const { config } = req.body;

  if (!config || typeof config !== 'object') {
    logger.warn('Validation failed for UI/UX config request', { body: req.body });
    return res.status(400).json({
      success: false,
      message: 'config is required and must be an object'
    });
  }

  next();
};

/**
 * Sanitize input to prevent injection attacks
 */
const sanitizeInput = (req, res, next) => {
  // Basic sanitization - remove potentially dangerous characters
  if (req.body) {
    const sanitizeString = (str) => {
      if (typeof str !== 'string') return str;
      // Remove null bytes and other control characters
      return str.replace(/[\x00-\x1F\x7F]/g, '');
    };

    const sanitizeObject = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[sanitizeString(key)] = typeof value === 'string' ? sanitizeString(value) : sanitizeObject(value);
      }
      return sanitized;
    };

    req.body = sanitizeObject(req.body);
  }

  next();
};

module.exports = {
  validateRegistration,
  validateUIUXConfig,
  sanitizeInput
};


