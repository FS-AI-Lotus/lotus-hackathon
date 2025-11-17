/**
 * Rate Limiting Middleware
 * 
 * Provides rate limiting middleware for protecting endpoints from abuse.
 * Uses express-rate-limit with different limits for different routes.
 * 
 * Rate limiters:
 * - Strict: For /register (10 requests per 15 minutes)
 * - Moderate: For /route (100 requests per minute)
 * - General: For other protected routes (200 requests per minute)
 */

const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

/**
 * Create a rate limiter with custom configuration
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {string} options.message - Error message when limit exceeded
 * @param {Function} options.keyGenerator - Function to generate key for tracking (default: IP-based)
 * @returns {Function} Express rate limiter middleware
 */
function createRateLimiter(options) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => {
      // Prefer service ID from JWT if available, fallback to IP
      if (req.serviceContext && req.serviceContext.serviceId) {
        return req.serviceContext.serviceId;
      }
      // Use proper IP key generator for IPv6 support
      return ipKeyGenerator(req) || 'unknown';
    },
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too Many Requests',
      message,
      retryAfter: Math.ceil(windowMs / 1000), // Seconds
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    keyGenerator,
    // Skip rate limiting for successful requests (only count failures)
    skip: (req) => {
      // Don't skip - count all requests
      return false;
    },
    // Handler for when limit is exceeded
    handler: (req, res) => {
      // Log security event (will be wired to logger in Iteration 4)
      // For now, just return error
      res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
}

/**
 * Strict rate limiter for /register endpoint
 * 10 requests per 15 minutes per service/IP
 */
const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many registration requests. Please try again in 15 minutes.',
});

/**
 * Moderate rate limiter for /route endpoint
 * 100 requests per minute per service/IP
 */
const moderateRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many routing requests. Please try again in a minute.',
});

/**
 * General rate limiter for other protected routes
 * 200 requests per minute per service/IP
 */
const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  message: 'Too many requests. Please try again in a minute.',
});

module.exports = {
  strictRateLimiter,
  moderateRateLimiter,
  generalRateLimiter,
  createRateLimiter,
};

