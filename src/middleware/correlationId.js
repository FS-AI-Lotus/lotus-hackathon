/**
 * Correlation ID Middleware
 * 
 * Express middleware that generates or reads correlation IDs for request tracing.
 * Reads X-Request-Id header if present, otherwise generates a UUID.
 * Attaches correlation ID to req.correlationId for use in logging and tracing.
 */

const { randomUUID } = require('crypto');

/**
 * Correlation ID Middleware
 * 
 * Generates or reads correlation ID from X-Request-Id header.
 * Attaches to req.correlationId for downstream use.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function correlationIdMiddleware(req, res, next) {
  // Read correlation ID from header, or generate new one
  const correlationId = req.headers['x-request-id'] || randomUUID();
  
  // Attach to request object
  req.correlationId = correlationId;
  
  // Add to response headers for client tracing
  res.setHeader('X-Request-Id', correlationId);
  
  // Continue to next middleware
  next();
}

module.exports = correlationIdMiddleware;

