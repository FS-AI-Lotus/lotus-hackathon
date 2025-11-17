/**
 * HTTP Metrics Middleware
 * 
 * Express middleware that automatically records HTTP request metrics.
 * Should be placed early in the middleware stack to capture all requests.
 * 
 * Usage:
 *   const httpMetricsMiddleware = require('./src/monitoring/httpMetricsMiddleware');
 *   app.use(httpMetricsMiddleware);
 */

const { startTimer } = require('./metrics');

/**
 * HTTP Metrics Middleware
 * Records request duration, status codes, and error counts
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function httpMetricsMiddleware(req, res, next) {
  // Extract route path (normalize to handle Express route patterns)
  const route = req.route ? req.route.path : req.path || req.url.split('?')[0];
  const method = req.method;

  // Start timer for this request
  const stopTimer = startTimer(route, method);

  // Override res.end to capture response status and completion
  const originalEnd = res.end;
  res.end = function(...args) {
    // Call original end
    originalEnd.apply(res, args);

    // Record metrics with status code
    stopTimer(res.statusCode);
  };

  // Continue to next middleware
  next();
}

module.exports = httpMetricsMiddleware;

