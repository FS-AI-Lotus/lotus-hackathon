const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(err.status || 500).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  const cleanPath = req.path || req.url;
  logger.warn('Route not found', { 
    path: cleanPath, 
    method: req.method,
    originalUrl: req.originalUrl,
    url: req.url
  });
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${cleanPath} not found`,
    hint: 'Make sure the URL does not contain trailing spaces or newlines. Try: POST /register'
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};

